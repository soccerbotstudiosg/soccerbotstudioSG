import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createBookingMechanism } from "./booking-mechanism-fixture.mjs";

const wall = (ms) =>
  new Date(ms + 28800000).toISOString().slice(0, 19).replace("T", " ");

/** One provider studio with two slots, shared by two independently owned attempts. */
export async function createBookingCollision(options = {}) {
  const bookings = new Map();
  const reached = Promise.withResolvers();
  const release = Promise.withResolvers();
  let starts;
  let batchCreated = false;
  const example = JSON.parse(
    readFileSync("worker/tests/native-fixtures.json", "utf8"),
  ).responses.creation.bookings[0];
  const m = await createBookingMechanism({
    ...options,
    startSlot: 1,
    async respond(call) {
      const body = call.body;
      const rpc = (result) =>
        Response.json({ jsonrpc: "2.0", id: body.id, result });
      if (body?.method === "getAvailableUnits")
        return rpc(
          starts.some((ms) => wall(ms) === body.params[1] && !bookings.has(ms))
            ? [14]
            : [],
        );
      if (
        ["getAvailableTimeIntervals", "getStartTimeMatrix"].includes(
          body?.method,
        )
      ) {
        const days = {};
        for (
          const d = new Date(`${body.params[0]}T00:00:00Z`);
          d.toISOString().slice(0, 10) <= body.params[1];
          d.setUTCDate(d.getUTCDate() + 1)
        ) {
          const day = d.toISOString().slice(0, 10);
          const available = starts.filter(
            (ms) => wall(ms).startsWith(day) && !bookings.has(ms),
          );
          days[day] =
            body.method === "getStartTimeMatrix"
              ? available.map((ms) => wall(ms).slice(11))
              : {
                  [String(body.params[3])]: available.map((ms) => [
                    wall(ms).slice(11),
                    wall(ms + 3000000).slice(11),
                  ]),
                };
        }
        return rpc(days);
      }
      if (body?.method === "createBatch") {
        assert.ok(!batchCreated && bookings.has(starts[1]));
        batchCreated = true;
        return rpc(601);
      }
      if (body?.method === "book") {
        const [, trainer, date, time, , , , batchId] = body.params;
        const ms = Date.parse(`${date}T${time}+08:00`);
        assert.equal(trainer, 14);
        if (!batchId) {
          assert.equal(ms, starts[1]);
          assert.equal(bookings.size, 0);
          bookings.set(ms, "701");
          // The base fixture supplies the first customer's native booking, invoice and HitPay request.
          return undefined;
        }
        assert.ok(batchCreated);
        assert.equal(String(batchId), "601");
        if (bookings.has(ms)) {
          assert.equal(ms, starts[1]);
          assert.equal(bookings.get(starts[0]), "702");
          reached.resolve();
          await release.promise;
          return Response.json({
            jsonrpc: "2.0",
            id: body.id,
            error: {
              code: -32000,
              message: "Synthetic shared studio occupied",
            },
          });
        }
        assert.equal(ms, starts[0]);
        bookings.set(ms, "702");
        return rpc({
          require_confirm: true,
          invoice: null,
          batch_id: 601,
          batch_hash: "synthetic-collision-batch",
          bookings: [
            {
              ...example,
              id: "702",
              event_id: 2,
              unit_id: trainer,
              client_id: "52",
              client_hash: "synthetic-second-customer",
              hash: "synthetic-batch-booking-702",
              start_date_time: wall(ms),
              end_date_time: wall(ms + 3000000),
            },
          ],
        });
      }
      // The partially created batch has no payable invoice. Its customer must never receive the first customer's signed booking details.
      if (
        body?.method === "getBookingDetails" &&
        String(body.params[0]) !== "701"
      )
        return new Response(null, { status: 503 });
      return undefined;
    },
  });
  starts = [m.startMs - 3000000, m.startMs];
  return {
    ...m,
    heldStartMs: starts[1],
    batchStarts: [...starts],
    secondAttemptReached: reached.promise,
    releaseSecondAttempt: () => release.resolve(),
    providerBookings: () =>
      Array.from(bookings, ([startMs, bookingId]) => ({ startMs, bookingId })),
  };
}
