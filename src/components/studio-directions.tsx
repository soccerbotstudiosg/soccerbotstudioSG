import { useId } from "react";

/** Show the Level 5 route from Lift Lobby 3 to the studio. */
export function StudioDirections() {
  const title = useId();
  return (
    <svg
      className="studio-directions"
      viewBox="12 8 644 440"
      role="img"
      aria-labelledby={title}
    >
      <title id={title}>
        Level 5 guide. Exit Lift Lobby 3 facing south, turn left and follow the
        corridor to unit 05-01.
      </title>
      <g strokeLinejoin="round">
        <path
          fill="#fafbfd"
          stroke="#bcc2d4"
          strokeWidth="2"
          d="M30 425V55Q30 25 60 25H300Q440 25 510 100Q590 175 620 355L640 425Z"
        />
        <g fill="#e9ebf2" stroke="#d2d6e2" strokeWidth="1.5">
          <path d="M50 116V63Q50 45 69 45H300Q422 45 490 110L455 170L385 132L270 115V90H160V116Z" />
          <path d="M470 215L530 160Q569 232 603 330L550 365Z" />
          <path d="M50 338H255V405H50Z" />
          <path d="M270 405V320H290V290H330V320H350V370H330V405Z" />
        </g>
        <path
          fill="none"
          stroke="#d2d6e2"
          d="M270 45V90M360 55L340 124M440 91L414 148M490 250L552 204M510 285L570 245M530 325L587 289"
        />
        <path
          className="studio-plan-unit"
          d="M550 365L603 330L615 372Q620 405 590 405H568Z"
        />
        <path
          fill="none"
          className="studio-plan-route"
          strokeWidth="7"
          strokeLinecap="round"
          d="M90 116V147Q90 165 108 165H330Q375 165 375 210V353Q375 380 402 380H558"
        />
        <path
          fill="var(--color-logo-blue)"
          d="m227 155 13 10-13 10zM365 250l10 13 10-13zM542 370l13 10-13 10z"
        />
        <circle
          cx="90"
          cy="116"
          r="7"
          fill="white"
          stroke="var(--color-logo-blue)"
          strokeWidth="4"
        />
      </g>
      <g fill="var(--color-brand)">
        <text x="64" y="75" fontSize="23" fontWeight="700">
          Lift Lobby 3
        </text>
        <text x="64" y="101" fontSize="19">
          PL-5 / PL-6
        </text>
        <text x="393" y="214" fontSize="18" fill="#545d74">
          Lifts
        </text>
        <path d="M417 193l24-37" fill="none" stroke="#8890a5" />
        <circle cx="441" cy="156" r="4" fill="#78829a" />
        <text x="63" y="365" fontSize="18" fill="#545d74">
          PL-3 / PL-4
        </text>
        <text x="63" y="390" fontSize="18" fill="#545d74">
          SL-1 / SL-2
        </text>
        <text x="397" y="323" fontSize="17" fontWeight="700">
          SoccerBotStudio
        </text>
        <text x="397" y="356" fontSize="31" fontWeight="700">
          #05-01
        </text>
        <circle cx="587" cy="375" r="8" fill="var(--color-brand)" />
        <circle cx="587" cy="375" r="3" fill="white" />
      </g>
    </svg>
  );
}
