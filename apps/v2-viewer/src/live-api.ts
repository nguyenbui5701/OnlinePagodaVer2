import { migrateVisualSettings, type SettingsSnapshot } from './live-settings.ts';

export const gatewayUrl = 'http://127.0.0.1:5203';
export class GatewayError extends Error {
  readonly status: number;
  readonly reason: string;
  readonly body: unknown;
  constructor(status: number, reason: string, body?: unknown) {
    super(reason || 'HTTP_' + status);
    this.status = status;
    this.reason = reason;
    this.body = body;
  }
}

export async function postGateway(path: string, data: object = {}, signal?: AbortSignal, keepalive = false, timeout = 3000) {
  const response = await fetch(gatewayUrl + path, {
    method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', keepalive,
    signal: keepalive ? undefined : signal ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout),
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new GatewayError(response.status, typeof body?.reason === 'string' ? body.reason : '', body);
  }
  return response;
}

export function readSettings(value: unknown): SettingsSnapshot {
  const data = value as SettingsSnapshot | null;
  const settings = migrateVisualSettings(data?.settings);
  if (!data || !Number.isSafeInteger(data.revision) || data.revision < 1 || !settings ||
      !['', 'MISSING', 'INVALID'].includes(data.warning)) throw new Error('Invalid settings snapshot');
  return { ...data, settings };
}