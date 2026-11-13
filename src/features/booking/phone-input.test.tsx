import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";
import { PhoneInput } from "./phone-input";
import { contactErrors } from "@/domain/contact";
function Field({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <PhoneInput
        value={value}
        onChange={setValue}
        onBlur={() => {}}
        error={
          value
            ? contactErrors({
                name: "Test Customer",
                email: "test@example.com",
                phone: value,
                contactMethod: "email",
                academy: "",
              }).phone
            : undefined
        }
      />
      <output data-testid="stored">{value}</output>
    </>
  );
}
test("phone input blocks invalid Singapore edits and retains a correctable existing number", () => {
  render(<Field initial="00000000" />);
  const input = screen.getByLabelText(/Mobile number/);
  expect(input).toHaveAttribute("placeholder", "9123 4567");
  expect(
    screen.getByText("Enter an 8-digit mobile number starting with 8 or 9."),
  ).toBeVisible();
  fireEvent.change(input, { target: { value: "0000000" } });
  expect(input).toHaveValue("0000000");
  fireEvent.change(input, { target: { value: "" } });
  fireEvent.change(input, { target: { value: "6" } });
  expect(input).toHaveValue("");
  fireEvent.change(input, { target: { value: "81234567" } });
  expect(screen.getByTestId("stored")).toHaveTextContent("+6581234567");
  fireEvent.change(input, { target: { value: "812345678" } });
  expect(input).toHaveValue("81234567");
  fireEvent.change(input, { target: { value: "8123x4567" } });
  expect(input).toHaveValue("81234567");
});
test("phone country search supports keyboard selection and full international paste", () => {
  render(<Field />);
  fireEvent.click(
    screen.getByRole("button", { name: "Country code: Singapore +65" }),
  );
  const search = screen.getByRole("combobox", {
    name: "Search country or dial code",
  });
  expect(search).toHaveFocus();
  fireEvent.change(search, { target: { value: "United Kingdom" } });
  fireEvent.keyDown(search, { key: "Enter" });
  expect(
    screen.getByRole("button", { name: "Country code: United Kingdom +44" }),
  ).toHaveFocus();
  const input = screen.getByLabelText(/Mobile number/);
  expect(input).toHaveAttribute("placeholder", "07400 123456");
  fireEvent.paste(input, {
    clipboardData: { getData: () => "+44 7911 123456" },
  });
  expect(screen.getByTestId("stored")).toHaveTextContent("+447911123456");
  expect(input).toHaveValue("7911123456");
  fireEvent.paste(input, { clipboardData: { getData: () => "+65 9123 4567" } });
  expect(
    screen.getByRole("button", { name: "Country code: Singapore +65" }),
  ).toBeVisible();
  expect(input).toHaveValue("91234567");
  fireEvent.paste(input, { clipboardData: { getData: () => "8123\n4567" } });
  expect(input).toHaveValue("91234567");
  fireEvent.click(
    screen.getByRole("button", { name: "Country code: Singapore +65" }),
  );
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});
