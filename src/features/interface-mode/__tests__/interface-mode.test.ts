import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { getInterfaceMode, setInterfaceMode, useInterfaceMode } from "../interface-mode";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("interface-mode", () => {
  it("defaults to luna when nothing is stored", () => {
    expect(getInterfaceMode()).toBe("luna");
  });

  it("defaults to luna when the stored value is invalid", () => {
    window.sessionStorage.setItem("luna.interfaceMode", "something-else");
    expect(getInterfaceMode()).toBe("luna");
  });

  it("roundtrips through setInterfaceMode/getInterfaceMode", () => {
    setInterfaceMode("npp");
    expect(getInterfaceMode()).toBe("npp");

    setInterfaceMode("luna");
    expect(getInterfaceMode()).toBe("luna");
  });

  it("useInterfaceMode() reflects a change made via setInterfaceMode()", () => {
    const { result } = renderHook(() => useInterfaceMode());
    expect(result.current).toBe("luna");

    act(() => {
      setInterfaceMode("npp");
    });

    expect(result.current).toBe("npp");
  });
});
