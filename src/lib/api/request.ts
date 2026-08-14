import { NextResponse, type NextRequest } from "next/server";

export async function readJsonObject(
  request: NextRequest,
): Promise<{ body: Record<string, unknown> } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      response: NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      ),
    };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      response: NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      ),
    };
  }

  return { body: body as Record<string, unknown> };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function parseString(
  value: unknown,
  options?: { trim?: boolean; allowEmpty?: boolean },
): string | null {
  if (typeof value !== "string") return null;
  const result = options?.trim === false ? value : value.trim();
  if (!options?.allowEmpty && result.length === 0) return null;
  return result;
}

export function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim();
}

export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

export function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
}

export function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => typeof item === "string")) return null;
  return value.map((item) => item.trim());
}

export function parseHexColor(value: unknown): string | null {
  const color = parseString(value);
  if (!color) return null;
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) ? color : null;
}
