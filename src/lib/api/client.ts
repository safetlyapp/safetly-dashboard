export async function readApiError(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text().catch(() => "");
  const body = rawBody.trim();

  if (!body) return fallback;
  if (body.startsWith("<")) return fallback;

  const parsePayload = (payload: unknown) => {
    if (!payload || typeof payload !== "object") return null;
    const value = payload as { error?: unknown; message?: unknown };
    if (typeof value.error === "string" && value.error.trim()) {
      return value.error;
    }
    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }
    return null;
  };

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(body) as unknown;
      return parsePayload(parsed) ?? fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const parsed = JSON.parse(body) as unknown;
    return parsePayload(parsed) ?? fallback;
  } catch {
    return body;
  }
}
