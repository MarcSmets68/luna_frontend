"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const dirtyForms = new Set<symbol>();
const HISTORY_INDEX = "__lunaNavigationIndex";
export const UNSAVED_CHANGES_MESSAGE =
  "Je hebt niet-bewaarde wijzigingen. Wil je deze pagina verlaten en de wijzigingen weggooien?";

export function confirmNavigation(): boolean {
  return confirmDiscardChanges(dirtyForms.size > 0);
}

export function confirmDiscardChanges(dirty: boolean): boolean {
  return !dirty || window.confirm(UNSAVED_CHANGES_MESSAGE);
}

export function useUnsavedChanges(dirty: boolean) {
  const [key] = useState(() => Symbol("form"));

  useEffect(() => {
    if (dirty) dirtyForms.add(key);
    return () => { dirtyForms.delete(key); };
  }, [dirty, key]);

  return useCallback(() => { dirtyForms.delete(key); }, [key]);
}

export function useGuardedRouter() {
  const router = useRouter();
  return {
    ...router,
    push: (...args: Parameters<typeof router.push>) => {
      if (confirmNavigation()) router.push(...args);
    },
    replace: (...args: Parameters<typeof router.replace>) => {
      if (confirmNavigation()) router.replace(...args);
    },
  };
}

function historyIndex(state: unknown): number | undefined {
  if (state && typeof state === "object" && HISTORY_INDEX in state) {
    const index = (state as Record<string, unknown>)[HISTORY_INDEX];
    if (typeof index === "number") return index;
  }
}

function indexedState(state: unknown, index: number) {
  return { ...(state && typeof state === "object" ? state : {}), [HISTORY_INDEX]: index };
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { history } = window;
    const originalPush = history.pushState;
    const originalReplace = history.replaceState;
    let index = historyIndex(history.state) ?? 0;
    let restoring = false;
    let active = true;

    originalReplace.call(history, indexedState(history.state, index), "");
    const push: History["pushState"] = (state, unused, url) => {
      if (!active) {
        originalPush.call(history, state, unused, url);
        return;
      }
      const next = index + 1;
      originalPush.call(history, indexedState(state, next), unused, url);
      index = next;
    };
    const replace: History["replaceState"] = (state, unused, url) => {
      originalReplace.call(history, active ? indexedState(state, index) : state, unused, url);
    };
    history.pushState = push;
    history.replaceState = replace;

    function beforeUnload(event: BeforeUnloadEvent) {
      if (dirtyForms.size === 0) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href);
      // Full document/external navigation is handled by beforeunload.
      if (destination.origin !== location.origin || (destination.pathname === location.pathname && destination.search === location.search)) return;
      if (!confirmNavigation()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    function popState(event: PopStateEvent) {
      const next = historyIndex(event.state);
      if (restoring) {
        restoring = false;
        event.stopImmediatePropagation();
        return;
      }
      if (next !== undefined && next !== index && !confirmNavigation()) {
        // Restore the original entry before Next handles a rejected Back/Forward.
        restoring = true;
        event.stopImmediatePropagation();
        history.go(index - next);
        return;
      }
      if (next !== undefined) index = next;
    }

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", popState, true);
    return () => {
      // Next may retain these wrappers after Strict Mode's effect cleanup.
      active = false;
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
      window.removeEventListener("popstate", popState, true);
      if (history.pushState === push) history.pushState = originalPush;
      if (history.replaceState === replace) history.replaceState = originalReplace;
    };
  }, []);

  return children;
}
