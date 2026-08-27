import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "../login-form";

const onSubmitMock = vi.fn();

beforeEach(() => {
  onSubmitMock.mockReset();
});

describe("LoginForm", () => {
  it("blocks submit and shows field errors when both fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmitMock} isSubmitting={false} serverError={null} />);

    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    expect(await screen.findByText("Gebruikerskode is verplicht")).toBeInTheDocument();
    expect(screen.getByText("Wachtwoord is verplicht")).toBeInTheDocument();
    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it("blocks submit when only kode is filled in", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmitMock} isSubmitting={false} serverError={null} />);

    await user.type(screen.getByRole("textbox", { name: "Gebruikerskode" }), "MS");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    expect(await screen.findByText("Wachtwoord is verplicht")).toBeInTheDocument();
    expect(screen.queryByText("Gebruikerskode is verplicht")).not.toBeInTheDocument();
    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the trimmed kode and the password once both fields are valid", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmitMock} isSubmitting={false} serverError={null} />);

    await user.type(screen.getByRole("textbox", { name: "Gebruikerskode" }), " MS ");
    await user.type(screen.getByLabelText("Wachtwoord"), "geheim123");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    expect(onSubmitMock).toHaveBeenCalledWith({ kode: "MS", password: "geheim123" });
  });

  it("disables the submit button while isSubmitting is true (prevents double-submit)", () => {
    render(<LoginForm onSubmit={onSubmitMock} isSubmitting={true} serverError={null} />);
    expect(screen.getByRole("button", { name: "Bezig met inloggen..." })).toBeDisabled();
  });

  it("shows the 401 server error message above the form", () => {
    render(
      <LoginForm
        onSubmit={onSubmitMock}
        isSubmitting={false}
        serverError="Gebruikersnaam of wachtwoord onjuist"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Gebruikersnaam of wachtwoord onjuist"
    );
  });

  it("shows the 403 server error message above the form", () => {
    render(
      <LoginForm
        onSubmit={onSubmitMock}
        isSubmitting={false}
        serverError="Dit account is niet actief. Neem contact op met de beheerder."
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dit account is niet actief. Neem contact op met de beheerder."
    );
  });

  it("renders no error banner when serverError is null", () => {
    render(<LoginForm onSubmit={onSubmitMock} isSubmitting={false} serverError={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
