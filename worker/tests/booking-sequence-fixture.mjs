// Isolated multi-reservation provider state over the existing real Worker harness.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createBookingMechanism } from "./booking-mechanism-fixture.mjs";

const wall = (ms) =>
  new Date(ms + 28800000).toISOString().slice(0, 19).replace("T", " ");
/** Retain distinct provider records across complete consecutive customer journeys. */
export async function createBookingSequence(sizes, options = {}) {
  assert.ok(
    sizes.length === 3 && sizes.every((size) => size === 1 || size === 2),
  );
  let journeys;
  const m = await createBookingMechanism({
    ...options,
    async respond(call) {
      assert.ok(journeys, "provider calls must follow sequence initialization");
      const { body, method } = call;
      const url = new URL(call.url);
      const rpc = (result) =>
        Response.json({ jsonrpc: "2.0", id: body.id, result });
      if (url.hostname === "api.sandbox.hit-pay.com") {
        const j =
          method === "POST"
            ? journeys.find((item) => item.closed && !item.reference)
            : journeys.find((item) =>
                url.pathname.endsWith("/" + item.requestId),
              );
        assert.ok(j, "payment request must belong to one created reservation");
        if (method === "POST") {
          assert.equal(body.amount, j.total);
          assert.equal(body.currency, "SGD");
          assert.ok(
            !journeys.some((item) => item.reference === body.reference_number),
          );
          j.reference = body.reference_number;
        }
        return Response.json({
          id: j.requestId,
          reference_number: j.reference,
          amount: j.total,
          currency: "SGD",
          status: j.paid ? "completed" : "pending",
          allow_repeated_payments: false,
          is_currency_editable: false,
          business_id: "00000000-0000-4000-8000-000000000003",
          url: j.checkoutUrl,
          expiry_date: wall(Date.now() + 180000),
          payments: j.paid
            ? [
                {
                  id: j.paymentId,
                  amount: j.total,
                  currency: "SGD",
                  status: "succeeded",
                  refunded_amount: "0",
                },
              ]
            : [],
        });
      }
      const invoicePath = /^\/admin\/invoices\/(\d+)(\/accept-payment)?$/.exec(
        url.pathname,
      );
      if (invoicePath) {
        const j = journeys.find(
          (item) => String(item.invoice.id) === invoicePath[1],
        );
        assert.ok(
          j?.closed,
          "invoice read must identify a finalized reservation",
        );
        if (invoicePath[2]) {
          assert.equal(method, "PUT");
          assert.ok(
            j.paid && !j.invoice.payment_received,
            "accounting must happen exactly once after payment",
          );
          assert.deepEqual(body, { payment_processor: "manual" });
          Object.assign(j.invoice, {
            payment_received: true,
            payment_processor: "manual",
            status: "paid",
          });
          for (const session of j.sessions)
            Object.assign(session.details, {
              invoice_payment_received: "1",
              invoice_payment_processor: "manual",
              invoice_status: "paid",
            });
        }
        return Response.json(j.invoice);
      }
      if (
        ["getStartTimeMatrix", "getAvailableTimeIntervals"].includes(
          body?.method,
        )
      ) {
        const matrix = {};
        for (
          let d = new Date(body.params[0] + "T00:00:00Z");
          d.toISOString().slice(0, 10) <= body.params[1];
          d.setUTCDate(d.getUTCDate() + 1)
        ) {
          const date = d.toISOString().slice(0, 10);
          matrix[date] = journeys.flatMap((j) =>
            j.sessions
              .filter((s) => !s.booked && wall(s.startMs).startsWith(date))
              .map((s) => wall(s.startMs).slice(11)),
          );
        }
        return rpc(
          body.method === "getAvailableTimeIntervals"
            ? Object.fromEntries(
                Object.entries(matrix).map(([date, starts]) => [
                  date,
                  {
                    [String(body.params[3])]: starts.map((start) => [
                      start,
                      new Date(Date.parse(`${date}T${start}Z`) + 50 * 60000)
                        .toISOString()
                        .slice(11, 19),
                    ]),
                  },
                ]),
              )
            : matrix,
        );
      }
      if (body?.method === "getAvailableUnits")
        return rpc(
          journeys.some((j) =>
            j.sessions.some(
              (s) => !s.booked && wall(s.startMs) === body.params[1],
            ),
          )
            ? [14]
            : [],
        );
      if (body?.method === "createBatch") {
        const j = journeys.find((item) => !item.closed);
        assert.ok(j && j.sessions.length > 1 && !j.batchCreated);
        j.batchCreated = true;
        return rpc(j.batchId);
      }
      if (body?.method === "book") {
        const start = body.params[2] + " " + body.params[3];
        const j = journeys.find((item) =>
          item.sessions.some((s) => wall(s.startMs) === start),
        );
        const session = j?.sessions.find((s) => wall(s.startMs) === start);
        assert.ok(
          session && !session.booked,
          "an occupied session must never be created twice",
        );
        assert.equal(body.params[0], 2);
        assert.equal(body.params[1], 14);
        assert.equal(body.params[7], j.sessions.length > 1 ? j.batchId : null);
        if (j.sessions.length > 1) assert.ok(j.batchCreated);
        session.booked = true;
        if (j.sessions.length === 1) j.closed = true;
        return rpc({
          require_confirm: j.sessions.length > 1,
          bookings: j.sessions.filter((s) => s.booked).map((s) => s.creation),
          invoice: j.closed ? j.invoice : null,
          ...(j.sessions.length > 1
            ? {
                batch_id: j.batchId,
                batch_hash: `synthetic-batch-${j.batchId}`,
              }
            : {}),
        });
      }
      if (body?.method === "closeBatch") {
        const j = journeys.find((item) => item.batchId === body.params[0]);
        assert.ok(
          j?.batchCreated && !j.closed && j.sessions.every((s) => s.booked),
        );
        j.closed = true;
        return rpc({
          invoice: j.invoice,
          bookings: Object.fromEntries(
            j.sessions.map((s) => [s.creation.id, s.creation]),
          ),
        });
      }
      if (body?.method === "getBookingDetails") {
        const session = journeys
          .flatMap((j) => j.sessions)
          .find((s) => String(s.details.id) === String(body.params[0]));
        assert.ok(
          session?.booked,
          "readback must identify the exact created booking",
        );
        return rpc(session.details);
      }
      return undefined;
    },
  });
  const fixtures = JSON.parse(
    readFileSync("worker/tests/native-fixtures.json", "utf8"),
  ).responses;
  let slot = 0;
  journeys = sizes.map((size, index) => {
    const invoice = structuredClone(fixtures.invoiceBefore);
    invoice.id = 901 + index;
    invoice.amount = invoice.deposit = 88 * size;
    invoice.number = `SYNTHETIC-ORDER-${index}`;
    invoice.due_datetime = new Date(Date.now() + 900000)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
    invoice.lines = [];
    const sessions = Array.from({ length: size }, () => {
      const number = slot++;
      const id = 701 + number;
      const startMs = m.startMs + number * 3000000;
      const creation = {
        ...structuredClone(fixtures.creation.bookings[0]),
        id: String(id),
        event_id: 2,
        unit_id: 14,
        start_date_time: wall(startMs),
        end_date_time: wall(startMs + 3000000),
        hash: `synthetic-booking-${id}`,
        client_hash: "synthetic-client-hash",
      };
      const details = {
        ...structuredClone(fixtures.bookingBefore),
        id: String(id),
        event_id: "2",
        invoice_id: String(invoice.id),
        invoice_amount: (88 * size).toFixed(4),
        invoice_line_id: String(801 + number),
        start_date_time: wall(startMs),
        end_date_time: wall(startMs + 3000000),
        invoice_number: invoice.number,
      };
      const line = structuredClone(fixtures.invoiceBefore.lines[0]);
      Object.assign(line, {
        id: String(801 + number),
        invoice_id: invoice.id,
        booking_ids: [id],
      });
      Object.assign(line.bookings[0], {
        id,
        service_id: 2,
        start_datetime: wall(startMs),
        end_datetime: wall(startMs + 3000000),
      });
      invoice.lines.push(line);
      return { startMs, creation, details, booked: false };
    });
    const requestId = `20000000-0000-4000-8000-${String(index + 20).padStart(12, "0")}`;
    return {
      invoice,
      sessions,
      batchId: 601 + index,
      batchCreated: false,
      closed: false,
      reference: null,
      paid: false,
      total: (88 * size).toFixed(2),
      requestId,
      paymentId: `20000000-0000-4000-8000-${String(index + 30).padStart(12, "0")}`,
      checkoutUrl: `https://checkout.sandbox.hit-pay.com/payment-request/@soccerbot/${requestId}/checkout`,
    };
  });
  return {
    ...m,
    get checkoutUrl() {
      return (journeys.findLast((j) => j.reference) ?? journeys[0]).checkoutUrl;
    },
    journeys: journeys.map((j) => ({
      starts: j.sessions.map((s) => s.startMs),
      checkoutUrl: j.checkoutUrl,
      invoiceId: String(j.invoice.id),
    })),
    async completeJourney(index) {
      const j = journeys[index];
      assert.ok(j.reference && !j.paid);
      j.paid = true;
      const body = JSON.stringify({
        id: j.requestId,
        reference_number: j.reference,
        status: "completed",
      });
      return m.mf.dispatchFetch(m.origin + "/api/webhooks/hitpay", {
        method: "POST",
        body,
        headers: {
          "content-type": "application/json",
          "Hitpay-Signature": createHmac("sha256", "synthetic-salt")
            .update(body)
            .digest("hex"),
        },
      });
    },
  };
}
