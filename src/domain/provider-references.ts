import { z } from "zod";
// Display metadata only; never an invoice identity or confirmation authority.
export const invoiceNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) =>
    [...value].every((character) => {
      const code = character.codePointAt(0)!;
      return code >= 32 && code !== 127;
    }),
  );
export const providerReferencesSchema = z.strictObject({
  bookingIds: z.array(z.string().min(1).max(128)).min(1).max(12),
  invoiceNumber: invoiceNumberSchema.optional(),
  invoiceId: z.string().min(1).max(128),
});
