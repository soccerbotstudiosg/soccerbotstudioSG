import { BOOKING_SUPPORT, CONTACT, LOCATION } from "../src/domain/catalog";

type Message = {
  origin: string;
  heading: string;
  name?: string;
  introduction: string;
  fields?: readonly (readonly [string, string])[];
  code?: string;
  note: string;
  link?: { label: string; url: string };
};

/** Escape all customer values before placing them in email markup or attributes. */
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

/** Render the shared transactional email shell without scripts or attachment effects. */
export function notificationHtml(message: Message) {
  const origin = new URL(message.origin).origin;
  const link = (label: string, url: string) =>
    `<a href="${escape(url)}" style="color:#76d3ff;text-decoration:underline">${escape(label)}</a>`;
  const wordmark = `<img src="${origin}/assets/email-wordmark.png" width="160" alt="SoccerBotStudio Singapore" style="display:block;width:160px;max-width:100%;height:auto">`;
  const rows = (message.fields ?? [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:0 0 10px;color:#fff"><strong>${escape(label)}</strong><br><span style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(value || "Not provided")}</span></td></tr>`,
    )
    .join("");
  const hero = `${origin}/assets/6cd9490f80ba.jpg`;
  const footerPairs = [
    ["SoccerBotStudio Singapore", LOCATION.building],
    [
      "Performance · Experience · Production",
      `${LOCATION.street}, ${LOCATION.unit}<br>${LOCATION.postal}`,
    ],
    [
      link("Terms and Condition", `${origin}/terms-of-service/`),
      link("Website", origin),
    ],
    [
      link("Privacy Policy", `${origin}/privacy-policy/`),
      link("Instagram", CONTACT.instagram),
    ],
    ["", link("WhatsApp us", BOOKING_SUPPORT.whatsappUrl)],
  ];
  return `<!doctype html><html lang="en" dir="ltr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(message.heading)}</title>
<style>@media only screen and (max-width:480px){
  .email-hero{padding:48px 12px 0!important}.email-body{padding:0 12px!important}
  .email-title{font-size:22px!important}.email-footer{padding:18px 12px!important}
}</style></head>
<body style="margin:0;background:#f7f8fa;font-family:Roboto,Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" bgcolor="#10032b" style="width:100%;max-width:640px;background:#10032b;color:#fff">
<tr><td align="center" style="padding:12px">${wordmark}</td></tr>
<tr><td class="email-hero" background="${hero}" style="padding:176px 10% 0;background-color:#10032b;background-image:url('${hero}');background-position:center 48%;background-size:cover">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#162441"><tr><td style="padding:15px 12px 10px">
    <h1 class="email-title" style="margin:0;color:#46b6ea;font-size:24px;font-weight:700;font-style:italic;line-height:1.2">${escape(message.heading)}</h1>
  </td></tr></table>
</td></tr>
<tr><td class="email-body" style="padding:0 10%">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#162441"><tr><td style="padding:10px 12px 16px;color:#fff;font-size:15px;line-height:1.45">
    <p style="margin:0 0 16px">${escape(message.name?.trim() ? `Hello ${message.name.trim()},` : "Hello human,")}</p>
    <p style="margin:0 0 12px">${escape(message.introduction)}</p>
    ${message.code ? `<p class="email-code" style="margin:12px 0;padding:12px;background:#f0eff7;color:#10032b;border-left:3px solid #10032b;border-radius:0 8px 8px 0;text-align:center;font-size:44px;line-height:1.2;letter-spacing:4px;font-weight:800">${escape(message.code)}</p>` : ""}
    ${rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.45">${rows}</table>` : ""}
    <p style="margin:14px 0 0">${escape(message.note)}</p>
    ${message.link ? `<p style="margin:8px 0 0">${link(message.link.label, message.link.url)}</p>` : ""}
    <p style="margin:12px 0 0">The SoccerBotStudio Singapore team</p>
  </td></tr></table>
</td></tr>
<tr><td class="email-footer" style="padding:24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:12px;line-height:1.45;color:#fff">
<tr><td colspan="2" align="center" style="padding-bottom:14px">${wordmark}</td></tr>
${footerPairs.map(([left, right]) => `<tr><td width="50%" valign="top" style="padding:3px 8px 3px 0">${left}</td><td width="50%" valign="top" align="right" style="padding:3px 0 3px 8px">${right}</td></tr>`).join("")}
<tr><td colspan="2" align="center" style="padding-top:14px">© SoccerBotStudio Singapore</td></tr>
</table></td></tr></table></td></tr></table></body></html>`;
}

/** Render verification without revealing an unverified account name. */
export function verificationHtml(origin: string, code: string) {
  return notificationHtml({
    origin,
    heading: "Your verification code",
    introduction: "Enter this code on the website to sign in.",
    code,
    note: "Expires in 2 minutes. Do not share this code. If you did not request it, ignore this email.",
  });
}

/** Render the submitted enquiry using the same field labels as the website. */
export function enquiryHtml(
  origin: string,
  values: Record<string, string>,
  team: boolean,
) {
  return notificationHtml({
    origin,
    heading: team ? "New website enquiry" : "Enquiry received",
    name: team ? "SoccerBotStudio team" : values.name,
    introduction: team
      ? "A visitor has submitted the enquiry below."
      : "We’ve received your enquiry and will reach out as soon as we can.",
    fields: [
      ["Full name", values.name],
      ["Email address", values.email],
      ["Mobile number", values.phone],
      ["Academy, school or organisation", values.organisation],
      ["Enquiry type", values.purpose],
      ["Number of guests", values.guests],
      ["Preferred date", values.date],
      ["Preferred time (SGT)", values.time],
      ["Your requirements", values.message],
    ],
    note: team
      ? "Reply directly to the visitor about this enquiry."
      : "This email acknowledges your enquiry; it does not confirm a booking.",
    link: {
      label: team ? "Reply to enquiry" : "Contact us about your enquiry",
      url: team ? `mailto:${values.email}` : `mailto:${CONTACT.email}`,
    },
  });
}

export const rejectedBookingEmailNotice =
  "The booking service rejected the email address submitted for this attempt. No booking was created and no payment was requested.";

/** Render one retained support category without inferring failure or nonpayment. */
export function bookingHelpHtml(
  origin: string,
  category: string,
  name: string,
  fields: readonly (readonly [string, string])[],
  team: boolean,
) {
  const introduction =
    category === "contact_email_rejected"
      ? rejectedBookingEmailNotice
      : category === "payment_confirmation_pending"
        ? "Payment received. We are still confirming your booking."
        : category === "checkout_unconfirmed"
          ? "We could not confirm your checkout status."
          : "We could not confirm your booking status.";
  const message = [
    "Please help with my booking.",
    introduction,
    ...fields.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");
  return notificationHtml({
    origin,
    heading: team ? "Booking help requested" : "Help has been requested",
    name: team ? "SoccerBotStudio team" : name,
    introduction,
    fields,
    note:
      category === "contact_email_rejected"
        ? team
          ? "Please help the customer check their original booking email before they try again."
          : "We’ve received your help request and will help you check the email address before trying again."
        : team
          ? "Check the original booking and payment records before making changes or asking for another payment."
          : "We will get back as soon as we can. Please do not pay again. This acknowledgement does not confirm a booking, cancellation or refund.",
    ...(team
      ? {}
      : {
          link: {
            label: "Get help on WhatsApp",
            url: `${BOOKING_SUPPORT.whatsappUrl}?text=${encodeURIComponent(message)}`,
          },
        }),
  });
}
