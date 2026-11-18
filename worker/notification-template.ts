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
  const rows = (message.fields ?? [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:0 0 14px"><strong style="font-size:12px;color:#55627a">${escape(label)}</strong><br><span style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(value || "Not provided")}</span></td></tr>`,
    )
    .join("");
  const footerPairs = [
    ["SoccerBotStudio Singapore", LOCATION.building],
    [
      "Performance · Experience · Production",
      `${LOCATION.street}, ${LOCATION.unit}<br>${LOCATION.postal}`,
    ],
    [
      link("Terms of Service", `${origin}/terms-of-service/`),
      link("Website", origin),
    ],
    [
      link("Privacy Policy", `${origin}/privacy-policy/`),
      link("Instagram", CONTACT.instagram),
    ],
    [
      link("Refund Policy", `${origin}/refund-policy/`),
      link("WhatsApp us", BOOKING_SUPPORT.whatsappUrl),
    ],
  ];
  return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(message.heading)}</title><style>@font-face{font-family:Roboto;src:url("${origin}/assets/9d867fc3ef40.woff2") format("woff2");font-weight:400}@font-face{font-family:Roboto;src:url("${origin}/assets/f2c3487396a2.woff2") format("woff2");font-weight:900;font-style:italic}@media only screen and (max-width:480px){.message-inner{padding:20px 14px!important}.message-title{font-size:20px!important}.email-hero{padding-top:110px!important}.email-code{font-size:36px!important;letter-spacing:3px!important}}</style></head><body style="margin:0;background:#edf0f7;font-family:Roboto,Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#050a2f;color:#fff"><tr><td align="center" style="padding:24px;background:#050a2f"><img src="${origin}/assets/email-wordmark.png" width="230" alt="SoccerBotStudio Singapore" style="display:block;width:230px;max-width:80%;height:auto;mix-blend-mode:screen"></td></tr><tr><td class="email-hero" background="${origin}/assets/6cd9490f80ba.jpg" style="padding:180px 6% 32px;background-color:#050a2f;background-image:linear-gradient(to bottom,transparent 100px,#050a2f 380px),url('${origin}/assets/6cd9490f80ba.jpg');background-size:100% 440px,100% auto;background-position:center top,center -70px;background-repeat:no-repeat"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#102741"><tr><td class="message-inner" style="padding:28px 24px"><h1 class="message-title" style="margin:0 0 18px;color:#46acdc;font-size:26px;font-weight:900;font-style:italic;line-height:1.15">${escape(message.heading)}</h1><p style="margin:0 0 18px">${escape(message.name?.trim() ? `Hello ${message.name.trim()},` : "Hello human,")}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff;color:#10152f;border-radius:16px"><tr><td style="padding:24px;font-size:15px;line-height:1.6"><p style="margin:0 0 20px">${escape(message.introduction)}</p>${message.code ? `<p class="email-code" style="margin:16px 0;text-align:center;font-size:44px;line-height:1.2;letter-spacing:5px;font-weight:800;color:#000;font-variant-numeric:tabular-nums">${escape(message.code)}</p>` : ""}<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table></td></tr></table><p style="font-size:13px;line-height:1.6;margin:20px 0">${escape(message.note)}</p>${message.link ? `<p>${link(message.link.label, message.link.url)}</p>` : ""}<p style="font-size:13px;line-height:1.5">The SoccerBotStudio Singapore team</p></td></tr><tr><td style="padding:24px;background:#050a2f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:11px;line-height:1.4;color:#dce1f1"><tr><td colspan="2" align="center" style="padding-bottom:14px"><img src="${origin}/assets/email-wordmark.png" width="160" alt="SoccerBotStudio Singapore" style="display:block;max-width:100%;height:auto;mix-blend-mode:screen"></td></tr>${footerPairs.map(([left, right]) => `<tr><td width="50%" valign="top" style="padding:3px 8px 3px 0">${left}</td><td width="50%" valign="top" align="right" style="padding:3px 0 3px 8px">${right}</td></tr>`).join("")}<tr><td colspan="2" align="center" style="padding-top:14px">© SoccerBotStudio Singapore</td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`;
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

/** Render one retained support category without inferring failure or nonpayment. */
export function bookingHelpHtml(
  origin: string,
  category: string,
  name: string,
  fields: readonly (readonly [string, string])[],
  team: boolean,
) {
  const introduction =
    category === "payment_confirmation_pending"
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
    note: team
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
