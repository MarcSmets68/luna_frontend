import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode, useEffect, type ReactNode } from "react";
import {
  confirmNavigation, UNSAVED_CHANGES_MESSAGE, UnsavedChangesProvider,
  useGuardedRouter, useUnsavedChanges,
} from "../unsaved-changes";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

function RouterHistoryPatch({ children }: { children: ReactNode }) {
  useEffect(() => {
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);
    history.pushState = (...args) => originalPush(...args);
    history.replaceState = (...args) => originalReplace(...args);
    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    };
  }, []);
  return children;
}

function Form({ dirty = true }: { dirty?: boolean }) {
  const markSaved = useUnsavedChanges(dirty);
  const router = useGuardedRouter();
  return <>
    <button onClick={() => router.push("/next")}>Leave</button>
    <button onClick={() => router.replace("/next")}>Replace</button>
    <button onClick={() => { markSaved(); router.push("/saved"); }}>Save</button>
  </>;
}

beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  history.replaceState({ __NA: true, tree: ["retained"] }, "", "/");
  push.mockReset();
  replace.mockReset();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("unsaved changes", () => {
  it("keeps traversal indexes aligned when Next retains wrappers across Strict Mode cleanup", () => {
    const nativePush = history.pushState;
    const nativeReplace = history.replaceState;
    const go = vi.spyOn(history, "go").mockImplementation(() => {});
    const view = render(<StrictMode><RouterHistoryPatch><UnsavedChangesProvider><Form /></UnsavedChangesProvider></RouterHistoryPatch></StrictMode>);
    try {
      history.pushState({ __NA: true }, "", "/first");
      const first = history.state;
      history.pushState({ __NA: true }, "", "/second");
      vi.mocked(window.confirm).mockReturnValue(true);
      window.dispatchEvent(new PopStateEvent("popstate", { state: first }));
      history.replaceState(first, "", "/first");
      expect(history.state).toMatchObject(first);
      history.pushState({ __NA: true }, "", "/third");
      expect(history.state.__lunaNavigationIndex).toBe(first.__lunaNavigationIndex + 1);
      vi.mocked(window.confirm).mockReturnValue(false);
      window.dispatchEvent(new PopStateEvent("popstate", { state: first }));
      expect(go).toHaveBeenCalledWith(1);
    } finally {
      view.unmount();
      history.pushState = nativePush;
      history.replaceState = nativeReplace;
    }
  });

  it("guards programmatic push/replace and allows an explicit discard", () => {
    render(<Form />);
    fireEvent.click(screen.getByText("Leave"));
    fireEvent.click(screen.getByText("Replace"));
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(window.confirm).toHaveBeenCalledWith(UNSAVED_CHANGES_MESSAGE);
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByText("Leave"));
    expect(push).toHaveBeenCalledWith("/next");
  });

  it("does not warn for unchanged/reverted forms or after successful saving", () => {
    const view = render(<Form dirty={false} />);
    fireEvent.click(screen.getByText("Leave"));
    view.rerender(<Form />);
    fireEvent.click(screen.getByText("Save"));
    expect(push).toHaveBeenLastCalledWith("/saved");
    expect(window.confirm).not.toHaveBeenCalled();
    view.rerender(<Form dirty={false} />);
    view.rerender(<Form />);
    expect(confirmNavigation()).toBe(false);
  });

  it("tracks multiple forms independently and cleans up on unmount", () => {
    const first = render(<Form />);
    const second = render(<Form />);
    first.unmount();
    expect(confirmNavigation()).toBe(false);
    second.unmount();
    vi.mocked(window.confirm).mockClear();
    expect(confirmNavigation()).toBe(true);
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("protects reload/close only while dirty and removes all listeners", () => {
    const view = render(<UnsavedChangesProvider><Form /></UnsavedChangesProvider>);
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
    view.rerender(<UnsavedChangesProvider><Form dirty={false} /></UnsavedChangesProvider>);
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    view.unmount();
    expect(confirmNavigation()).toBe(true);
  });

  it("blocks normal same-tab links before Next handles them, not new tabs or hashes", () => {
    const navigate = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(<UnsavedChangesProvider><Form /><a href="/other" onClick={navigate}>Other</a><a href="#section" onClick={navigate}>Section</a></UnsavedChangesProvider>);
    const link = screen.getByText("Other");
    fireEvent.click(link);
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { metaKey: true });
    fireEvent.click(screen.getByText("Section"));
    expect(navigate).toHaveBeenCalledTimes(3);
    expect(window.confirm).toHaveBeenCalledTimes(1);
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(link);
    expect(navigate).toHaveBeenCalledTimes(4);
  });

  it("restores rejected history traversals without losing Next state or adding entries", () => {
    const go = vi.spyOn(history, "go").mockImplementation(() => {});
    render(<UnsavedChangesProvider><Form /></UnsavedChangesProvider>);
    const original = history.state;
    history.pushState({ __NA: true, tree: ["new"] }, "", "/next");
    const current = history.state;
    expect(current).toMatchObject({ __NA: true, tree: ["new"] });
    const nextListener = vi.fn();
    window.addEventListener("popstate", nextListener);
    window.dispatchEvent(new PopStateEvent("popstate", { state: original }));
    expect(go).toHaveBeenCalledWith(1);
    expect(nextListener).not.toHaveBeenCalled();
    window.dispatchEvent(new PopStateEvent("popstate", { state: current }));
    expect(nextListener).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(true);
    window.dispatchEvent(new PopStateEvent("popstate", { state: original }));
    expect(nextListener).toHaveBeenCalledTimes(1);
    window.removeEventListener("popstate", nextListener);
  });
});
