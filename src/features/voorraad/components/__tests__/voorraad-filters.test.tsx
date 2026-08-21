import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { VoorraadFilters } from "../voorraad-filters";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// The Checkbox primitive renders a visible `role="checkbox"` element plus a
// visually-hidden native `<input>` for form semantics, both wrapped by the
// same `<label>` - `getByLabelText`/`getByRole(..., { name })` therefore
// don't reliably disambiguate a single checkbox by its label text here.
// Querying by role and indexing in render order (intern/extern/externInBewerking) is stable instead.
function getCheckboxes() {
  return screen.getAllByRole("checkbox");
}

describe("VoorraadFilters", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders the three filter checkboxes, unchecked by default", () => {
    render(<VoorraadFilters externInBewerking={false} />);
    const [intern, extern, externInBewerking] = getCheckboxes();
    expect(intern).not.toBeChecked();
    expect(extern).not.toBeChecked();
    expect(externInBewerking).not.toBeChecked();
  });

  it("reflects onderMinimum='beide' as both checkboxes checked", () => {
    render(<VoorraadFilters onderMinimum="beide" externInBewerking={false} />);
    const [intern, extern] = getCheckboxes();
    expect(intern).toBeChecked();
    expect(extern).toBeChecked();
  });

  it("navigates with onderMinimum=intern when only the intern checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<VoorraadFilters externInBewerking={false} />);
    const [intern] = getCheckboxes();
    await user.click(intern);
    expect(pushMock).toHaveBeenCalledWith("/voorraad?page=1&onderMinimum=intern");
  });

  it("navigates with onderMinimum=beide when both intern and extern are already checked and a third toggle happens", async () => {
    const user = userEvent.setup();
    render(<VoorraadFilters onderMinimum="intern" externInBewerking={false} />);
    const [, extern] = getCheckboxes();
    await user.click(extern);
    expect(pushMock).toHaveBeenCalledWith("/voorraad?page=1&onderMinimum=beide");
  });

  it("navigates with externInBewerking=true when that checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<VoorraadFilters externInBewerking={false} />);
    const [, , externInBewerking] = getCheckboxes();
    await user.click(externInBewerking);
    expect(pushMock).toHaveBeenCalledWith("/voorraad?page=1&externInBewerking=true");
  });

  it("resets page to 1 and drops onderMinimum when unchecking the last active toggle", async () => {
    const user = userEvent.setup();
    render(<VoorraadFilters onderMinimum="intern" externInBewerking={false} />);
    const [intern] = getCheckboxes();
    await user.click(intern);
    expect(pushMock).toHaveBeenCalledWith("/voorraad?page=1");
  });
});
