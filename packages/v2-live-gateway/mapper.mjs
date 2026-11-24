import { createHash } from 'node:crypto';
import { displayName, sanitizeChat } from '../v2-events/src/registry.ts';

export const kinds = ['chat', 'member', 'like', 'roomUser', 'gift'];
const numericId = value => typeof value === 'string' && /^[1-9][0-9]{0,29}$/.test(value) ? value : undefined;
const stable = (tag, ...parts) => tag + ':' + createHash('sha256').update(JSON.stringify(parts)).digest('hex');
const countIn = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
export const normalizeUsername = value => typeof value === 'string' && /^@?[a-zA-Z0-9_.]{1,24}$/.test(value.trim())
  ? value.trim().replace(/^@/, '').toLowerCase() : undefined;

export function inScope(raw, roomId, startedAt, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || !numericId(roomId)) return false;
  const common = raw.common;
  if (common?.roomId && common.roomId !== '0' && common.roomId !== roomId) return false;
  const time = Number(numericId(common?.createTime));
  const timeMs = time < 1e12 ? time * 1000 : time;
  return !Number.isFinite(timeMs) || (timeMs >= startedAt - 5000 && timeMs <= now + 60_000);
}

export function mapEvent(kind, raw, roomId, startedAt, now = Date.now()) {
  if (!kinds.includes(kind) || !inScope(raw, roomId, startedAt, now)) return;
  const message = numericId(raw.common?.msgId);
  const eventId = message && stable(kind, roomId, message);

  if (kind === 'roomUser') {
    const count = typeof raw.total === 'string' && /^\d{1,12}$/.test(raw.total) ? Number(raw.total) : NaN;
    if (eventId && countIn(count, 0, 1_000_000_000)) return { type: 'room', eventId, count };
    return;
  }
  if (kind === 'like') {
    if (eventId && countIn(raw.count, 1, 1_000_000)) return { type: 'like', eventId, count: raw.count };
    return;
  }

  // Numeric provider identity stays stable when a viewer renames their handle or display name.
  const user = numericId(raw.user?.id);
  if (!user) return;
  const name = [raw.user.nickname, raw.user.displayId].find(value => typeof value === 'string' && value.trim());
  const storedName = displayName(name || 'Khách TikTok');
  const viewer = { userKey: stable('tt', roomId, user), name: storedName === 'Khách DEMO' ? 'Khách TikTok' : storedName };
  if (kind === 'member' && eventId) return { type: 'member', eventId, viewer };
  if (kind === 'chat') {
    const chatText = sanitizeChat(raw.content)?.text;
    if (eventId && chatText) return { type: 'chat', eventId, viewer, chatText };
  }
  if (kind !== 'gift') return;
  const giftId = numericId(raw.giftId);
  if (!giftId || !countIn(raw.repeatCount, 1, 9999) || !countIn(raw.repeatEnd, 0, 1) ||
      !countIn(raw.gift?.type, 0, 100)) return;
  const group = numericId(raw.groupId);
  const order = numericId(raw.orderId);
  const recipient = numericId(raw.toUser?.id) || roomId;
  const combo = raw.gift.type === 1;
  const phase = combo && raw.repeatEnd === 0 ? 'progress' : 'final';
  // Group correlates progress and final. An order also identifies a final with no observed progress.
  const groupKey = combo && group && stable('group', roomId, user, giftId, group, recipient);
  const streakId = groupKey || (phase === 'final' && order && stable('order', roomId, user, giftId, order, recipient));
  if ((combo && !streakId) || (!streakId && !message)) return;
  return {
    type: 'gift', eventId: stable('gift', roomId, streakId || message, phase, phase === 'progress' ? raw.repeatCount : null),
    viewer, giftId, count: raw.repeatCount, phase, ...(streakId ? { streakId } : {})
  };
}

export function isFinalGift(raw) {
  return raw?.repeatEnd === 1 || (Number.isSafeInteger(raw?.gift?.type) && raw.gift.type !== 1);
}