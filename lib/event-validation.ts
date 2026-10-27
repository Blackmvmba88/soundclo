const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validEvent(
  v: unknown,
): v is {
  id: string;
  sessionId: string;
  trackId: string;
  kind: string;
  positionMs: number;
} {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    uuid.test(e.id) &&
    typeof e.sessionId === "string" &&
    uuid.test(e.sessionId) &&
    typeof e.trackId === "string" &&
    /^\d{1,30}$/.test(e.trackId) &&
    ["PLAY", "PAUSE", "PROGRESS", "FINISH"].includes(String(e.kind)) &&
    Number.isInteger(e.positionMs) &&
    Number(e.positionMs) >= 0 &&
    Number(e.positionMs) <= 86400000
  );
}
