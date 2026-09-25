/**
 * Renders the thrown error's message verbatim - do not reinterpret the
 * backend's 400/401/403/404/409 messages. Mirrors
 * stockbeweging-error-state.tsx.
 */
export function KwaliteitscontroleErrorState({ message }: { message: string }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
