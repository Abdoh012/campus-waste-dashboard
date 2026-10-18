import { useCallback, useState } from "react";
import { navItems } from "../mockData";
import type { NavId } from "../types";

export interface ActiveSectionState {
  activeId: NavId;
  /** Selects a destination. */
  navigate: (id: NavId) => void;
}

/**
 * The dock's active destination.
 *
 * Selection is explicit: the highlight starts on the first destination and only
 * `navigate` moves it, so scrolling the dashboard never changes the active tab.
 * Scrolling is not handled here either — each dock anchor carries its section's
 * `#id` as its href, so the browser does the scrolling.
 */
export function useActiveSection(): ActiveSectionState {
  const [activeId, setActiveId] = useState<NavId>(navItems[0].id);

  const navigate = useCallback((id: NavId) => setActiveId(id), []);

  return { activeId, navigate };
}
