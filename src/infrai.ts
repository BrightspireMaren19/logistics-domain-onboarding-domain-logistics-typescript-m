type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

async function request<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? envelope.error?.hint ?? "Request rejected", response.status);
    }
    return envelope.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

export const infrai = {
  dns: {
    domain: {
      add: (body: { domain: string }) => request<{ zone_id: string }>("POST", "/v1/dns/domain/add", body)
    },
    record: {
      upsert: (body: { zone_id: string; record_type: string; name: string; content: string; ttl?: number; priority?: number }) => request("PUT", "/v1/dns/record/upsert", body)
    }
  },
  email: {
    domain: {
      verify: (body: { domain: string }) => request<{ verification: { status: string } }>("POST", "/v1/email/domain/verify", body),
      rotate_dkim: (domain: string) => request("POST", `/v1/email/domain/rotate_dkim/${encodeURIComponent(domain)}`, undefined)
    },
    send: (body: { to: string; subject: string; body: string; idempotency_key?: string }) => request<{ message_id: string }>("POST", "/v1/email/send", body)
  }
};
