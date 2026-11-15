import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { InstructorProfile } from "./instructor";
test("instructor profile renders supplied display data without a fixed roster lookup", () => {
  const { rerender } = render(
    <InstructorProfile
      profile={{
        name: "New Trainer",
        initials: "NT",
        role: "Instructor",
        bio: "Current supplied profile.",
      }}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "New Trainer" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("NT")).not.toBeInTheDocument();
  expect(document.querySelector(".trainer-avatar svg")).toBeInTheDocument();
  rerender(
    <InstructorProfile
      profile={{
        name: "Renamed Trainer",
        initials: "RT",
        role: "Instructor",
        bio: "Changed profile.",
      }}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Renamed Trainer" }),
  ).toBeInTheDocument();
});
