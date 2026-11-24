import { ViewTransition, type ReactNode } from "react";

/**
 * A template re-mounts on every navigation (a layout doesn't), so each page
 * change plays the soft fade-and-rise defined in globals.css (.sp-page).
 * default="none" keeps refreshes and in-page updates still.
 */
export default function AdminTemplate({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="sp-page" exit="sp-page" default="none">
      {children}
    </ViewTransition>
  );
}
