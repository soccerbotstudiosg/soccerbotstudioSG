import { afterEach, expect, it, vi } from "vitest";
import { createLiveIdentityService } from "./identity";
afterEach(() => vi.unstubAllGlobals());
const identity = {
  email: "synthetic@example.invalid",
  expiresAt: Date.now() + 600000,
};
const challenge = {
  email: identity.email,
  challengeId: "11111111-1111-4111-8111-111111111111",
  expiresAt: identity.expiresAt,
  resendAfter: 0,
};
it("live identity requires a fresh bot proof and sends it only after guest access", async () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  await expect(service.challenge(identity.email, signal)).rejects.toThrow(
    "Complete the security check",
  );
  expect(request).not.toHaveBeenCalled();
  request
    .mockResolvedValueOnce(Response.json({ access: "guest" }))
    .mockResolvedValueOnce(
      Response.json({
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        resendAfter: 0,
      }),
    );
  expect(
    await service.challenge(identity.email, signal, "synthetic-token"),
  ).toEqual(challenge);
  expect(request.mock.calls.map((c) => c[0])).toEqual([
    "/api/access",
    "/api/identity/challenges",
  ]);
  expect(JSON.parse(request.mock.calls[1][1].body)).toEqual({
    email: identity.email,
    botToken: "synthetic-token",
  });
});
it("live identity authenticates guest and verifies through same-origin server reads without browser storage", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access: "guest" }))
    .mockResolvedValueOnce(Response.json(identity))
    .mockResolvedValueOnce(Response.json(identity));
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  await service.guest(signal);
  expect(await service.verify(challenge, "123456", false, signal)).toEqual(
    identity,
  );
  expect(request.mock.calls.map((c) => c[0])).toEqual([
    "/api/access",
    "/api/identity/verify",
    "/api/identity",
  ]);
  for (const [, options] of request.mock.calls)
    expect(options).toMatchObject({
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    });
  expect(service.current()).toEqual(identity);
});
it("live identity discards verification arriving after signout and never pre-fills unbound provider records", async () => {
  let finish!: (value: Response) => void;
  const request = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(Response.json({ access: "revoked" }));
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  const pending = service.verify(challenge, "123456", true, signal);
  await service.signOut(signal);
  finish(Response.json(identity));
  await expect(pending).rejects.toThrow("unavailable");
  expect(service.current()).toBeNull();
  expect(await service.profile(identity.email, signal)).toBeNull();
  expect(request).toHaveBeenCalledTimes(2);
});
it("live identity rejects stale mismatched oversized and unavailable responses without demo success", async () => {
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  for (const response of [
    Response.json({ ...identity, email: "foreign@example.invalid" }),
    Response.json({ ...identity, expiresAt: 1 }),
    new Response("x".repeat(4097)),
    new Response(null, { status: 503 }),
  ]) {
    request.mockResolvedValueOnce(response);
    await expect(
      service.verify(challenge, "123456", false, signal),
    ).rejects.toThrow();
    expect(service.current()).toBeNull();
  }
  expect(request).toHaveBeenCalledTimes(4);
});
it("live remembered refresh creates only fresh guest access and rereads restored identity", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access: "guest" }))
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(Response.json(identity))
    .mockResolvedValueOnce(Response.json(identity));
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  expect(await service.refresh(signal)).toEqual(identity);
  expect(request.mock.calls.map((c) => [c[0], c[1].method])).toEqual([
    ["/api/access", "POST"],
    ["/api/identity", "GET"],
    ["/api/identity/restore", "POST"],
    ["/api/identity", "GET"],
  ]);
  expect(service.current()).toEqual(identity);
});
it("live remembered restoration arriving after signout cannot repopulate cached identity", async () => {
  let finish!: (response: Response) => void;
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access: "guest" }))
    .mockResolvedValueOnce(Response.json(null))
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(Response.json({ access: "revoked" }));
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  const pending = service.refresh(signal);
  await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(3));
  await service.signOut(signal);
  finish(Response.json(identity));
  await expect(pending).rejects.toThrow("unavailable");
  expect(service.current()).toBeNull();
  expect(request).toHaveBeenCalledTimes(4);
});
it("live verification transmits explicit consent and all-device signout uses its protected operation", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json(identity))
    .mockResolvedValueOnce(Response.json(identity))
    .mockResolvedValueOnce(Response.json({ access: "revoked" }));
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  await service.verify(challenge, "123456", true, signal);
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({
    challengeId: challenge.challengeId,
    email: challenge.email,
    code: "123456",
    remember: true,
  });
  await service.signOut(signal, true);
  expect(request.mock.calls[2][0]).toBe("/api/identity/all-devices");
  expect(service.current()).toBeNull();
});

it("website profile is loaded only for the current identity and saves only explicit name and phone", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access: "guest" }))
    .mockResolvedValueOnce(Response.json({ ...identity, remember: true }))
    .mockResolvedValueOnce(
      Response.json({
        email: identity.email,
        contact: { name: "Synthetic Contact", phone: "+65 8123 4567" },
      }),
    )
    .mockResolvedValueOnce(
      Response.json({ email: identity.email, saved: true }),
    );
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  expect(await service.profile(identity.email, signal)).toBeNull();
  expect(request).not.toHaveBeenCalled();
  await service.refresh(signal);
  const contact = await service.profile(identity.email, signal);
  expect(contact?.name).toBe("Synthetic Contact");
  await service.saveProfile(contact!, signal);
  expect(JSON.parse(request.mock.calls[3][1].body)).toEqual({
    email: identity.email,
    name: "Synthetic Contact",
    phone: "+65 8123 4567",
  });
});
it("website profile discards foreign and delayed post-signout responses", async () => {
  let finish!: (response: Response) => void;
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access: "guest" }))
    .mockResolvedValueOnce(Response.json(identity))
    .mockResolvedValueOnce(
      Response.json({
        email: "foreign@example.invalid",
        contact: { name: "Foreign Contact", phone: "+65 8123 4567" },
      }),
    )
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(Response.json({ access: "revoked" }));
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  await service.refresh(signal);
  await expect(service.profile(identity.email, signal)).rejects.toThrow();
  const pending = service.profile(identity.email, signal);
  await service.signOut(signal);
  finish(
    Response.json({
      email: identity.email,
      contact: { name: "Old Contact", phone: "+65 8123 4567" },
    }),
  );
  await expect(pending).rejects.toThrow();
  expect(service.current()).toBeNull();
});

it("website profile save rejects missing or false Remember me without a request", async () => {
  for (const remember of [undefined, false]) {
    const request = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access: "guest" }))
      .mockResolvedValueOnce(Response.json({ ...identity, remember }));
    vi.stubGlobal("fetch", request);
    const service = createLiveIdentityService(),
      signal = new AbortController().signal;
    await service.refresh(signal);
    await expect(
      service.saveProfile(
        {
          email: identity.email,
          name: "Booking Only",
          phone: "+65 8123 4567",
          contactMethod: "email",
          academy: "",
        },
        signal,
      ),
    ).rejects.toThrow();
    expect(request).toHaveBeenCalledTimes(2);
  }
});

it("all-device signout reports an actionable failure without claiming success", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({}, { status: 503 })),
  );
  await expect(
    createLiveIdentityService().signOut(new AbortController().signal, true),
  ).rejects.toThrow("Could not sign out all devices. Please try again.");
});

it("identity failures distinguish throttling expired access bad codes and security checks without exposing response bodies", async () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  const signal = new AbortController().signal;
  for (const [status, message] of [
    [429, "Wait a few minutes before requesting another code"],
    [401, "Return to booking options and verify your email again"],
    [400, "Check your code or request a new one"],
    [503, "Email verification unavailable. Please continue as a guest."],
  ] as const) {
    request.mockResolvedValueOnce(
      Response.json({ private: "must not appear" }, { status }),
    );
    await expect(
      createLiveIdentityService().verify(challenge, "123456", true, signal),
    ).rejects.toThrow(message);
  }
  request
    .mockResolvedValueOnce(Response.json({ access: "guest" }))
    .mockResolvedValueOnce(
      Response.json({ private: "must not appear" }, { status: 400 }),
    );
  await expect(
    createLiveIdentityService().challenge(
      identity.email,
      signal,
      "synthetic-token",
    ),
  ).rejects.toThrow("Complete the security check");
  request.mockResolvedValueOnce(Response.json({}, { status: 401 }));
  await expect(
    createLiveIdentityService().signOut(signal, true),
  ).rejects.toThrow(
    "Verify your email again, then choose Sign out all devices.",
  );
  for (const status of [400, 401, 403, 429, 503]) {
    request.mockResolvedValueOnce(
      Response.json({ private: "must not appear" }, { status }),
    );
    await expect(createLiveIdentityService().guest(signal)).rejects.toThrow(
      status === 429
        ? "Too many booking requests. Please wait a few minutes and try again."
        : "We couldn’t start your booking. Please try again.",
    );
    expect(request.mock.lastCall?.[0]).toBe("/api/access");
  }
  for (const response of [
    new Response(null),
    new Response("x".repeat(4097)),
    new Response("not-json"),
    Response.json({ access: "revoked" }),
  ]) {
    request.mockResolvedValueOnce(response);
    await expect(createLiveIdentityService().guest(signal)).rejects.toThrow(
      "We couldn’t start your booking. Please try again.",
    );
  }
  request.mockRejectedValueOnce(new TypeError("private transport detail"));
  await expect(createLiveIdentityService().guest(signal)).rejects.toThrow(
    "We couldn’t start your booking. Please try again.",
  );
  request.mockResolvedValueOnce(Response.json({}, { status: 503 }));
  await expect(createLiveIdentityService().signOut(signal)).rejects.toThrow(
    "Could not sign out this browser",
  );
});

it("a challenge superseded by signout cannot dispatch email after delayed guest access", async () => {
  let finish!: (value: Response) => void;
  const request = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(Response.json({ access: "revoked" }));
  vi.stubGlobal("fetch", request);
  const service = createLiveIdentityService(),
    signal = new AbortController().signal;
  const pending = service.challenge(identity.email, signal, "synthetic-token");
  await service.signOut(signal);
  finish(Response.json({ access: "guest" }));
  await expect(pending).rejects.toThrow("unavailable");
  expect(request.mock.calls.map((call) => [call[0], call[1].method])).toEqual([
    ["/api/access", "POST"],
    ["/api/access", "DELETE"],
  ]);
});
