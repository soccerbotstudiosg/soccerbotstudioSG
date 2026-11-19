import { z } from "zod";
import { ApiError, keyedHash } from "./policy";

export const recoveryIntakeField = z.string().regex(/^[a-f0-9]{32}$/);
export const recoveryMarker = z.strictObject({
  field: recoveryIntakeField,
  value: z.string().regex(/^[a-f0-9]{64}$/),
});
export type NativeCreationMarker = z.infer<typeof recoveryMarker>;

/** Recover only the private marker values saved on this grant's original dispatch. */
export function retainedCreationMarkers(
  field: string | undefined,
  json: string | null,
  count: number,
) {
  if (!field && json === null) return undefined;
  if (!field || !json)
    throw new ApiError(503, "native_creation_marker_unavailable");
  const values = z
    .array(recoveryMarker.shape.value)
    .length(count)
    .parse(JSON.parse(json));
  if (new Set(values).size !== count)
    throw new ApiError(503, "native_creation_marker_unavailable");
  return { field: recoveryIntakeField.parse(field), values };
}

/** Match the configured service intake field before sending an opaque marker. */
export function supportsRecoveryField(fields: unknown, configured?: string) {
  if (!configured) return Array.isArray(fields) && fields.length === 0;
  const definitions = z
    .tuple([
      z.object({
        name: z.literal(configured),
        type: z.enum(["text", "textarea"]),
      }),
    ])
    .safeParse(fields);
  return definitions.success;
}

/** Obtain the installation's existing keyed-hash secret for marker correlation. */
export function nativeCreationMarkerSecret(env: Env): string {
  const secret: unknown = Reflect.get(env, "IDENTITY_PEPPER");
  if (
    typeof secret !== "string" ||
    secret.length < 32 ||
    secret.length > 512 ||
    /\s/.test(secret)
  )
    throw new ApiError(503, "native_creation_marker_unavailable");
  return secret;
}

/** Derive one private correlation marker from the exact immutable booking scope. */
export function nativeCreationMarker(
  secret: string,
  scope: {
    accountId: string;
    environmentId: string;
    companyLogin: string;
    attemptId: string;
    intentHash: string;
  },
  index: number,
) {
  return keyedHash(secret, [
    "native-creation-marker-v1",
    scope.accountId,
    scope.environmentId,
    scope.companyLogin,
    scope.attemptId,
    scope.intentHash,
    String(index),
  ]);
}
