import { orderedSlots, slotKey, type Session } from "@/domain/booking";
import { dateLabel, endTime } from "@/domain/dates";
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
export function InstructorIdentity(props: InstructorProps) {
  const instructor = instructorDisplay(props);
  return (
    <>
      <span className="trainer-avatar" aria-hidden="true">
        {instructor.initials}
      </span>
      <div className="trainer-identity">
        <h3>{instructor.name}</h3>
        <span>{instructor.role}</span>
      </div>
    </>
  );
}
/** Present the instructor profile details. */
export function InstructorProfile(
  props: InstructorProps & { sessions?: Session[] },
) {
  const instructor = instructorDisplay(props);
  return (
    <article
      className="trainer-card trainer-profile"
      aria-label={instructor.name}
    >
      <div className="trainer-heading">
        <InstructorIdentity {...props} />
      </div>
      {instructor.bio && <p className="trainer-bio">{instructor.bio}</p>}
      {props.sessions && (
        <ul
          className="trainer-sessions"
          aria-label={`Sessions with ${instructor.name}`}
        >
          {orderedSlots(props.sessions).map((slot) => (
            <li key={slotKey(slot)}>
              {dateLabel(slot.date)} · {slot.start}–{endTime(slot.start)} SGT
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
