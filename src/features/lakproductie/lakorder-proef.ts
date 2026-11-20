export function lakorderProefBeschikbaar(): boolean {
  return process.env.NODE_ENV === "development" && process.env.LAKORDER_FIXTURES === "1";
}
