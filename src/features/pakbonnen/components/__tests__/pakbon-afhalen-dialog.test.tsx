import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PakbonAfhalenDialog } from "../pakbon-afhalen-dialog";

const afhalenPakbonMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    afhalenPakbon: (...args: unknown[]) => afhalenPakbonMock(...args),
  };
});

beforeEach(() => {
  afhalenPakbonMock.mockReset();
});

describe("PakbonAfhalenDialog", () => {
  it("posts the afgehaaldId and calls onAfgehaald with the full updated pakbon", async () => {
    const user = userEvent.setup();
    const onAfgehaald = vi.fn();
    const updated = { paknr: 500, afgehaald: true, afgehaaldId: "ID-123" };
    afhalenPakbonMock.mockResolvedValue(updated);

    render(
      <PakbonAfhalenDialog
        paknr={500}
        open={true}
        onOpenChange={() => {}}
        onAfgehaald={onAfgehaald}
      />
    );

    await user.type(screen.getByLabelText("Identificatie"), "ID-123");
    await user.click(screen.getByRole("button", { name: "Afhalen bevestigen" }));

    await waitFor(() => expect(afhalenPakbonMock).toHaveBeenCalledWith(500, "ID-123"));
    expect(onAfgehaald).toHaveBeenCalledWith(updated);
  });

  it("requires an identificatie before confirming", async () => {
    const user = userEvent.setup();

    render(
      <PakbonAfhalenDialog paknr={500} open={true} onOpenChange={() => {}} onAfgehaald={() => {}} />
    );

    await user.click(screen.getByRole("button", { name: "Afhalen bevestigen" }));

    expect(await screen.findByText("Vul een identificatie in.")).toBeInTheDocument();
    expect(afhalenPakbonMock).not.toHaveBeenCalled();
  });
});
