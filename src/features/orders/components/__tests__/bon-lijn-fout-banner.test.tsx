import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BonLijnFoutBanner } from "../bon-lijn-fout-banner";

const searchParamsMock = vi.fn(() => new URLSearchParams());
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock(),
}));

beforeEach(() => {
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
  sessionStorage.clear();
});

describe("BonLijnFoutBanner", () => {
  it("renders nothing without ?lijnFout=1", () => {
    sessionStorage.setItem(
      "luna:bon-lijn-fout:999",
      JSON.stringify({ failed: [{ omschrijving: "Lijn X", error: "400 Bad Request" }] })
    );
    const { container } = render(<BonLijnFoutBanner bonnr={999} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the sessionStorage content when ?lijnFout=1 and the key is present", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("lijnFout=1"));
    sessionStorage.setItem(
      "luna:bon-lijn-fout:999",
      JSON.stringify({ failed: [{ omschrijving: "Lijn X", error: "400 Bad Request" }] })
    );

    render(<BonLijnFoutBanner bonnr={999} />);

    expect(screen.getByText("Niet alle lijnen zijn opgeslagen.")).toBeInTheDocument();
    expect(screen.getByText("Lijn X: 400 Bad Request")).toBeInTheDocument();
  });

  it("removes the sessionStorage key after render", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("lijnFout=1"));
    const key = "luna:bon-lijn-fout:999";
    sessionStorage.setItem(
      key,
      JSON.stringify({ failed: [{ omschrijving: "Lijn X", error: "400 Bad Request" }] })
    );

    render(<BonLijnFoutBanner bonnr={999} />);

    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("renders nothing when ?lijnFout=1 but there is no sessionStorage entry", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("lijnFout=1"));
    const { container } = render(<BonLijnFoutBanner bonnr={999} />);
    expect(container).toBeEmptyDOMElement();
  });
});
