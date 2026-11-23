import { publicMetadata } from "@/content/seo";
export const metadata = publicMetadata("/privacy-policy/");
/** Publish the supplied studio policy. */
export default function Page() {
  return (
    <article className="legal-document">
      <header className="legal-heading">
        <h1 className="page-title">Privacy Policy</h1>
        <p>SoccerBotStudio Singapore · Last updated 19 November 2026</p>
      </header>
      <p>
        This Privacy Policy explains how PEAK Sportsventures Pte. Ltd. (UEN
        202502392Z), operator of SoccerBotStudio Singapore, collects, uses,
        discloses and protects your personal data, in line with the Personal
        Data Protection Act 2012 of Singapore (PDPA).
      </p>
      <h2>1. Personal data we collect</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Examples</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Contact details</th>
            <td>Name, email address, mobile number</td>
          </tr>
          <tr>
            <th scope="row">Player details</th>
            <td>
              Player name, age or date of birth, parent or guardian details for
              players under 18
            </td>
          </tr>
          <tr>
            <th scope="row">Booking details</th>
            <td>
              Sessions booked, package progress, attendance, trainer assigned
            </td>
          </tr>
          <tr>
            <th scope="row">Payment details</th>
            <td>
              Transaction records. Card details are processed by our payment
              provider and are not stored by us
            </td>
          </tr>
          <tr>
            <th scope="row">Health information</th>
            <td>
              Injuries or medical conditions you choose to tell us, so we can
              run sessions safely
            </td>
          </tr>
          <tr>
            <th scope="row">Performance data</th>
            <td>
              Scores, drills and results recorded by the SoccerBot360 system
            </td>
          </tr>
          <tr>
            <th scope="row">Photos and video</th>
            <td>
              Images and footage taken at the studio, including by the
              SoccerBot360 system
            </td>
          </tr>
          <tr>
            <th scope="row">Website data</th>
            <td>
              IP address, device and browser type, cookies and pages visited on
              our booking site
            </td>
          </tr>
        </tbody>
      </table>
      <h2>2. How we use your personal data</h2>
      <ul>
        <li>
          To process and manage bookings, payments, packages and cancellations
        </li>
        <li>
          To send booking confirmations, reminders and changes to your sessions
        </li>
        <li>To run sessions safely and track player progress</li>
        <li>To answer your questions and feedback</li>
        <li>To improve our programmes, facilities and booking site</li>
        <li>
          To send news, promotions and event invitations, only where you have
          agreed to receive them
        </li>
        <li>
          To feature photos and videos on our website and social media, unless
          you tell us you prefer to stay out of our content
        </li>
        <li>To meet our legal and regulatory obligations</li>
      </ul>
      <h2>3. Consent</h2>
      <ul>
        <li>
          By making a booking or giving us your personal data, you consent to us
          using it for the purposes above.
        </li>
        <li>
          For players under 18, the parent or guardian making the booking gives
          consent on the player&apos;s behalf.
        </li>
        <li>
          You may withdraw your consent at any time by contacting our Data
          Protection Officer. We will tell you what this means for your
          bookings, as we may be unable to provide some services without certain
          data.
        </li>
        <li>
          You can unsubscribe from marketing messages at any time using the link
          in each message or by contacting us.
        </li>
      </ul>
      <h2>4. Who we share your personal data with</h2>
      <p>
        We share your personal data only where needed for the purposes above,
        with:
      </p>
      <ul>
        <li>
          Our booking system partner, which hosts the booking site and booking
          records
        </li>
        <li>Payment providers, to process payments</li>
        <li>
          Our technology partner for the SoccerBot360 system, to run and
          maintain the system
        </li>
        <li>IT, hosting and messaging service providers</li>
        <li>Government or regulatory authorities, where required by law</li>
      </ul>
      <p>
        We require these parties to protect your personal data and use it only
        for the services they provide to us. We do not sell your personal data.
      </p>
      <h2>5. Transfers outside Singapore</h2>
      <p>
        Some of our service providers may store or process data outside
        Singapore. Where this happens, we take steps to make sure your personal
        data receives a standard of protection comparable to the PDPA.
      </p>
      <h2>6. How we protect your personal data</h2>
      <p>
        We use reasonable security measures, including access controls, secure
        systems and staff training, to protect your personal data from
        unauthorised access, use, disclosure, loss or damage. If a data breach
        occurs, we will notify the Personal Data Protection Commission and
        affected individuals as required by the PDPA.
      </p>
      <h2>7. How long we keep your personal data</h2>
      <p>
        We keep your personal data only for as long as it is needed for the
        purposes above, or as required by law. Booking and payment records are
        kept for 5 years for accounting purposes. We then delete or anonymise it
        securely.
      </p>
      <h2>8. Your rights</h2>
      <ul>
        <li>
          Access: you may ask for a copy of the personal data we hold about you
          and how it has been used in the past year.
        </li>
        <li>
          Correction: you may ask us to correct personal data that is inaccurate
          or incomplete.
        </li>
        <li>
          Withdrawal of consent: you may withdraw consent as described in
          section 3.
        </li>
      </ul>
      <p>
        We will respond to requests within 30 days. We may charge a reasonable
        fee for access requests and will tell you the fee before processing.
      </p>
      <h2>9. Cookies</h2>
      <p>
        Our booking site uses cookies to remember your preferences and
        understand how the site is used. You can block or delete cookies in your
        browser settings, though some parts of the booking site may stop
        working.
      </p>
      <h2>10. Changes to this Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The latest version
        will always be on our booking site, with the date it was last updated.
      </p>
      <h2>11. Contact our Data Protection Officer</h2>
      <p>
        For questions, requests or complaints about your personal data, please
        contact:
      </p>
      <p>
        Data Protection Officer PEAK Sportsventures Pte. Ltd. Apex@Henderson,
        201 Henderson Road, #05-01, Singapore 159545 Email:
        contact@soccerbotsg.com
      </p>
    </article>
  );
}
