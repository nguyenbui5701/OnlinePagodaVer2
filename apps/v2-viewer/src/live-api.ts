import { validSettings, type SettingsSnapshot } from './live-settings.ts';

export const gatewayUrl = 'http://127.0.0.1:5203';
export class GatewayError extends Error {
  readonly status: number;
  readonly reason: string;
  constructor(status: number, reason: string) {
    super(reason || 'HTTP_' + status);
    this.status = status;
    this.reason = reason;
  }
}

export async function postGateway(path: string, data: object = {}, signal?: AbortSignal, keepalive = false) {
  const response = await fetch(gatewayUrl + path, {
    method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', keepalive,
    signal: keepalive ? undefined : signal ? AbortSignal.any([signal, AbortSignal.timeout(3000)]) : AbortSignal.timeout(3000),
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new GatewayError(response.status, typeof body?.reason === 'string' ? body.reason : '');
  }
  return response;
}

export function readSettings(value: unknown): SettingsSnapshot {
  const data = value as SettingsSnapshot | null;
  if (!data || !Number.isSafeInteger(data.revision) || data.revision < 1 || !validSettings(data.settings) ||
      !['', 'MISSING', 'INVALID'].includes(data.warning)) throw new Error('Invalid settings snapshot');
  return data;
}