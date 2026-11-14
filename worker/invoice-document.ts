import { invoiceNumberSchema } from "../src/domain/provider-references";

/** Return a validated invoice number distinct from the retained unpaid order number. */
export async function retainedInvoiceNumber(
  env: Env,
  id: string,
  associationJson: string,
  candidate?: unknown,
  snapshot?: string | null,
) {
  const row =
    snapshot !== undefined
      ? snapshot
        ? (JSON.parse(snapshot) as {
            order_number: string;
            document_number: string | null;
          })
        : null
      : await env.STATE.withSession("first-primary")
          .prepare(
            "SELECT order_number,document_number FROM invoice_documents WHERE attempt_id=? AND association_json=?",
          )
          .bind(id, associationJson)
          .first<{ order_number: string; document_number: string | null }>();
  if (!row) return undefined;
  const parsed = invoiceNumberSchema.safeParse(candidate);
  if (parsed.success && parsed.data !== row.order_number) return parsed.data;
  const retained = invoiceNumberSchema.safeParse(row.document_number);
  return retained.success && retained.data !== row.order_number
    ? retained.data
    : undefined;
}
