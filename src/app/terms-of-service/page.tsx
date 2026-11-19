import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms and Conditions" };
/** Publish the supplied studio policy. */
export default function Page() {
  return (
    <article className="legal-document">
      <header className="legal-heading">
        <h1 className="page-title">Terms and Conditions</h1>
        <p>SoccerBotStudio Singapore · Last updated 19 November 2026</p>
      </header>
      <p>
        These Terms and Conditions apply to every booking made through the
        SoccerBotStudio Singapore booking site and to every visit to the studio.
        By making a booking, you agree to them.
      </p>
      <h2>1. About us</h2>
      <p>
        SoccerBotStudio Singapore (&quot;we&quot;, &quot;us&quot;,
        &quot;our&quot;) is operated by PEAK Sportsventures Pte. Ltd. (UEN
        202502392Z), located at Apex@Henderson, 201 Henderson Road, #05-01,
        Singapore 159545. You can reach us at contactus@soccerbotsg.com.
      </p>
      <h2>2. Bookings</h2>
      <ul>
        <li>
          All sessions, packages and arena hire must be booked in advance
          through our booking site, operated with our booking partner.
        </li>
        <li>
          A booking is confirmed only when you receive a confirmation by email
          or through the booking site.
        </li>
        <li>
          Session details such as date, time, trainer and duration are shown in
          your confirmation. Please check them and contact us straight away if
          anything is wrong.
        </li>
        <li>
          Each session runs for the time booked. Late arrivals will not extend
          the session.
        </li>
        <li>
          Please arrive 10 minutes before your session to check in, change and
          warm up.
        </li>
      </ul>
      <h2>3. Prices and payment</h2>
      <ul>
        <li>
          Prices are shown in Singapore dollars and include GST where
          applicable.
        </li>
        <li>
          Full payment is required at the time of booking, unless we agree
          otherwise in writing.
        </li>
        <li>
          We may change our prices at any time. Changes will not affect bookings
          or packages already paid for.
        </li>
        <li>
          Promotional prices and discount codes are subject to their own terms,
          cannot be combined unless stated, and have no cash value.
        </li>
      </ul>
      <h2>4. Packages</h2>
      <ul>
        <li>
          Session packages are valid for the period stated at purchase: 3 months
          for 5 session packages and 6 months for 10 session packages.
        </li>
        <li>
          Sessions unused at the end of the validity period will expire and are
          non refundable.
        </li>
        <li>
          Packages are for the named player and are non transferable, unless we
          agree otherwise in writing.
        </li>
        <li>
          Your package progress (for example, 3/5 sessions) is shown in your
          booking account or available from our team on request.
        </li>
      </ul>
      <h2>5. Rescheduling and cancellations</h2>
      <ul>
        <li>
          You may reschedule or cancel free of charge up to 24 hours before your
          session.
        </li>
        <li>
          Cancellations made less than 24 hours before the session, and no
          shows, will be charged in full or deducted from your package.
        </li>
        <li>
          Refunds for eligible cancellations of single sessions are made to the
          original payment method within 14 business days.
        </li>
        <li>
          If we need to cancel or reschedule a session, for example due to
          trainer illness or equipment maintenance, we will offer you a new slot
          or a full refund of that session.
        </li>
      </ul>
      <h2>6. Health and safety</h2>
      <ul>
        <li>
          SoccerBot360 sessions involve physical exercise. You confirm that you,
          or the player you are booking for, are in suitable health to take
          part.
        </li>
        <li>
          Please tell your trainer before the session about any injury, medical
          condition or concern.
        </li>
        <li>
          Players must wear suitable sports attire and footwear approved for
          indoor turf. Our team may refuse entry to the arena if footwear could
          damage the turf or cause injury.
        </li>
        <li>
          Please follow all instructions from our trainers and staff at all
          times.
        </li>
        <li>
          Food, drinks other than water, and glass containers are not allowed in
          the arena.
        </li>
      </ul>
      <h2>7. Players under 18</h2>
      <ul>
        <li>
          Bookings for players under 18 must be made by a parent or legal
          guardian, who accepts these Terms on the player&apos;s behalf.
        </li>
        <li>
          Players under 12 must have a parent, guardian or authorised adult
          present at the studio for the whole session.
        </li>
      </ul>
      <h2>8. Conduct</h2>
      <ul>
        <li>
          We expect every player and visitor to treat others, our staff and our
          equipment with respect.
        </li>
        <li>
          We may end a session early, without refund, if a player or visitor
          behaves in an unsafe, abusive or disruptive way.
        </li>
        <li>
          You are responsible for the cost of repairing any damage to the arena,
          turf or SoccerBot360 equipment caused on purpose or through careless
          behaviour.
        </li>
      </ul>
      <h2>9. Liability</h2>
      <ul>
        <li>
          You take part in all activities at your own risk, to the extent
          allowed by law.
        </li>
        <li>
          We are liable for death or personal injury caused by our negligence.
          Our liability for any other loss is limited to the amount you paid for
          the booking concerned.
        </li>
        <li>
          We are responsible for loss of or damage to personal belongings only
          where caused by our negligence. Please keep valuables with you or in
          the lockers provided.
        </li>
      </ul>
      <h2>10. Photography and filming</h2>
      <ul>
        <li>
          We may take photos and videos at the studio for our website and social
          media.
        </li>
        <li>
          If you prefer to stay out of our content, please tell our team at
          check in and we will respect your wishes.
        </li>
        <li>
          Session footage recorded by the SoccerBot360 system is handled as set
          out in our Privacy Policy.
        </li>
      </ul>
      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. The version on our booking
        site at the time of booking applies to that booking.
      </p>
      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of Singapore, and the courts of
        Singapore have exclusive jurisdiction over any dispute.
      </p>
      <h2>13. Contact us</h2>
      <p>
        PEAK Sportsventures Pte. Ltd. Apex@Henderson, 201 Henderson Road,
        #05-01, Singapore 159545 Email: contactus@soccerbotsg.com
      </p>
    </article>
  );
}
