/** Confirm domain mail routing without claiming that a mailbox exists. */
export async function checkEmailDomain(
  email: string,
  signal: AbortSignal,
): Promise<"valid" | "invalid" | "unavailable"> {
  try {
    const response = await fetch("/api/identity/email-domain", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email }),
      signal,
    });
    if (!response.ok) return "unavailable";
    const value: unknown = await response.json();
    return value &&
      typeof value === "object" &&
      "status" in value &&
      (value.status === "valid" || value.status === "invalid")
      ? value.status
      : "unavailable";
  } catch {
    return "unavailable";
  }
}
