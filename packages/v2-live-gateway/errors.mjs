// V1's allowlisted classification, keeping provider messages, URLs and headers out of IPC.
export function fault(error, depth = 0) {
  if (!error || typeof error !== 'object' || depth > 4) return 'UNKNOWN';
  if (error.exception) return fault(error.exception, depth + 1);
  const name = [error.name, error.constructor?.name].filter(Boolean).join(" ");
  const status = error.statusCode ?? error.status ?? error.response?.statusCode ?? error.response?.status;
  if (status === 429 || /SignatureRateLimitError/.test(name)) return 'RATE_LIMITED';
  if (status === 402 || /PremiumFeatureError/.test(name)) return 'PAID_ROUTE';
  if (status === 401 || status === 403 || /SignatureMissingTokens|AuthenticatedWebSocket/.test(name)) return 'ACCESS_DENIED';
  if (/UserOffline|StreamEnded/.test(name)) return 'ROOM_OFFLINE';
  const children = error.config?.requestErrs ?? [error.cause ?? error.config?.requestErr];
  const nested = Array.isArray(children) ? children.filter(Boolean).slice(0, 8).map(item => fault(item, depth + 1)) : [];
  for (const code of ['RATE_LIMITED', 'PAID_ROUTE', 'ACCESS_DENIED']) if (nested.includes(code)) return code;
  if (nested.length && nested.every(code => code === 'ROOM_OFFLINE')) return 'ROOM_OFFLINE';
  if (/SignAPIError/.test(name)) return 'SIGNING_FAILED';
  if (/Timeout|AbortError|TransportClosed/.test(name) ||
      /^(ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EHOSTUNREACH|UND_ERR_CONNECT_TIMEOUT)$/.test(String(error.code)) ||
      Number(status) >= 500 || nested.includes('NETWORK')) return 'NETWORK';
  return 'UNKNOWN';
}