import { useId } from "react";
import { Icon } from "@/components/icon";
import { INSTRUCTORS, type InstructorId } from "@/domain/demo-catalog";
type InstructorDisplay = {
  name: string;
  initials: string;
  role: string;
  bio: string;
};
type InstructorProps =
  | { id: InstructorId; profile?: never }
  | { id?: never; profile: InstructorDisplay };
function instructorDisplay(props: InstructorProps) {
  return props.profile ?? INSTRUCTORS[props.id];
}
/** Display the selected instructor's identity. */
export function InstructorIdentity(
  props: InstructorProps & { compact?: boolean },
) {
  const instructor = instructorDisplay(props);
  const IdentityContainer = props.compact ? "span" : "div";
  return (
    <>
      <span className="trainer-avatar" aria-hidden="true">
        {instructor.initials}
      </span>
      <IdentityContainer className="trainer-identity">
        {props.compact ? (
          <span className="trainer-name">{instructor.name}</span>
        ) : (
          <h3>{instructor.name}</h3>
        )}
        {!props.compact && <span>{instructor.role}</span>}
      </IdentityContainer>
    </>
  );
}
/** Present the instructor profile details. */
export function InstructorProfile(
  props: InstructorProps & {
    expanded?: boolean;
    onToggle?: () => void;
  },
) {
  const instructor = instructorDisplay(props);
  const biographyId = useId();
  return (
    <article
      className="trainer-card trainer-profile"
      aria-label={instructor.name}
    >
      {props.onToggle ? (
        <button
          className="trainer-toggle"
          aria-expanded={props.expanded}
          aria-controls={biographyId}
          onClick={props.onToggle}
        >
          <InstructorIdentity {...props} compact />
          <Icon name="chevron" />
        </button>
      ) : (
        <div className="trainer-heading">
          <InstructorIdentity {...props} />
        </div>
      )}
      <p
        className="trainer-bio"
        id={biographyId}
        hidden={!!props.onToggle && !props.expanded}
      >
        {instructor.bio ||
          "Trainer profile preview: interactive football activities, skill practice and team challenges. Full trainer biography coming soon."}
      </p>
    </article>
  );
}
