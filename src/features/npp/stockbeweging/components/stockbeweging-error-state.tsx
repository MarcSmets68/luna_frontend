/**
 * Renders the thrown error's message verbatim - do not reinterpret the
 * backend's 400/401/404/409 messages. Used next to the confirm dialog /
 * form, never bounces the flow back to the "artikel" step.
 */
export function StockbewegingErrorState({ message }: { message: string }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
