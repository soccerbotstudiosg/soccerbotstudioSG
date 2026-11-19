import { useId } from "react";

/** Render the supplied building layout with a shared-colour route and readable lift labels. */
export function StudioDirections() {
  const title = useId();
  return (
    <svg
      className="studio-directions"
      viewBox="0 0 760 450"
      role="img"
      aria-labelledby={title}
    >
      <title id={title}>
        Level 5 guide: exit Lift Lobby 3, PL-5 or PL-6, turn left and follow the
        blue route to SoccerBotStudio, unit #05-01. Other lifts are marked for
        orientation.
      </title>
      <g
        className="studio-plan-outline"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M30 425V55Q30 25 60 25H300Q440 25 510 100Q590 175 620 355L640 425Z" />
        <path d="M50 405V65Q50 45 70 45H300Q425 45 490 110L455 170L385 132L270 115V90H160V125H90V330H255V405Z" />
        <path d="M270 45V115M315 47L305 120M360 57L340 130M400 71L375 145M440 91L410 155M475 115L443 173" />
        <path d="M470 215L530 160L552 204L490 250ZM490 250L552 204L570 245L510 285ZM510 285L570 245L588 288L530 325ZM530 325L588 288L603 330L550 365Z" />
        <path
          className="studio-plan-unit"
          d="M550 365L603 330L615 372Q620 405 590 405H568Z"
        />
        <path d="M270 405V320H290V290H330V320H350V370H330V405Z" />
        <path d="M413 145L437 123L464 145L440 177Z" />
        <path d="M102 180H245V202H102ZM275 183L300 192L291 213L266 204ZM315 198L338 209L327 231L304 220Z" />
        <path d="M100 235H125V260H100ZM145 235H190V260H145ZM210 235H245V260H210ZM100 290H150V315H100ZM170 290H220V315H170ZM385 285H410V305H385ZM395 322H420V342H395Z" />
      </g>
      <g
        className="studio-plan-route"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M90 146V151Q90 165 108 165H325Q375 165 375 220V350Q375 380 410 380H551" />
      </g>
      <g className="studio-plan-unit">
        <path d="m229 157 12 8-12 8zM367 252l8 12 8-12zM541 372l12 8-12 8z" />
      </g>
      <g className="studio-plan-label">
        <rect x="55" y="101" width="155" height="45" rx="6" />
        <text x="67" y="119">
          Lift Lobby 3
        </text>
        <text x="67" y="137">
          PL-5 / PL-6
        </text>
        <rect x="45" y="337" width="175" height="62" rx="6" />
        <text x="57" y="356">
          Lifts
        </text>
        <text x="57" y="374">
          PL-3 / PL-4
        </text>
        <text x="57" y="392">
          SL-1 / SL-2
        </text>
        <path d="M440 150L524 100" />
        <rect x="515" y="72" width="72" height="32" rx="6" />
        <text x="528" y="94">
          Lifts
        </text>
        <path d="M590 374L645 327" />
        <rect x="583" y="280" width="170" height="46" rx="6" />
        <text x="595" y="300">
          SoccerBotStudio
        </text>
        <text x="595" y="319">
          #05-01
        </text>
      </g>
    </svg>
  );
}
