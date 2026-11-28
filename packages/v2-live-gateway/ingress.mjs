import { inScope, isFinalGift, kinds, mapEvent } from './mapper.mjs';
import { admissionSettings, admissionTier } from './admission.mjs';

export const rejectKeys = ['noRoom', 'wrongRoom', 'time', 'schema', 'identity', 'message'];
const counters = keys => Object.fromEntries(keys.map(key => [key, 0]));
const caps = { activity: 208, like: 216, chat: 232, member: 240, final: 256, control: 256 };
export const ingressKeys = [...kinds, ...rejectKeys, 'mapped', 'handoff', 'ipcPressure', 'ipcError'];
export const newIngress = () => counters(ingressKeys);

export function createIngress(transmit, exit) {
  const metrics = newIngress();
  let inFlight = 0;
  let halted = false;
  let previous = '';
  let reporting = false;
  let settings = admissionSettings();
  const pending = new Map();

  function send(message, priority = 'control', done, identity) {
    if (halted) return;
    const critical = priority === 'control' || priority === 'final';
    if (inFlight >= caps[priority]) {
      if (message.type === 'event') metrics.ipcPressure++;
      if (critical) {
        halted = true;
        if (!transmit({ type: 'fault', code: 'GIFT_DELIVERY_FAILED', ingressIncomplete: true },
          error => { if (error) exit(2); })) exit(2);
      }
      return;
    }
    inFlight++;
    if (identity) pending.set(identity, (pending.get(identity) ?? 0) + 1);
    const complete = error => {
      inFlight--;
      if (identity) {
        const remaining = pending.get(identity) - 1;
        if (remaining) pending.set(identity, remaining);
        else pending.delete(identity);
      }
      done?.(error);
      if (!error) return;
      if (message.type === 'event') { metrics.handoff--; metrics.ipcError++; }
      if (critical) exit(2);
    };
    if (message.type === 'event') metrics.handoff++;
    if (!transmit(message, complete)) complete(new Error('IPC closed'));
  }

  function flush() {
    const wire = JSON.stringify(metrics);
    if (wire === previous || reporting || halted || inFlight >= 240) return;
    reporting = true;
    send({ type: 'ingress', counts: { ...metrics } }, 'member', error => {
      reporting = false;
      if (!error) previous = wire;
    });
  }

  function receive(kind, packet, room, startedAt, now = Date.now()) {
    // Terminal IPC saturation reports an incomplete receipt; the parent tears down this generation.
    if (halted) return;
    metrics[kind]++;
    const event = mapEvent(kind, packet, room, startedAt, now, reason => metrics[reason]++);
    if (event) {
      metrics.mapped++;
      const tier = admissionTier(event, settings);
      const identity = tier === 'activity' ? undefined : tier + ':' + event.viewer.userKey;
      const priority = event.phase === 'final' ? 'final' : pending.has(identity) ? 'activity' : tier;
      send({ type: 'event', event }, priority, undefined, identity);
    } else if (kind === 'gift' && isFinalGift(packet) && inScope(packet, room, startedAt, now)) {
      flush();
      send({ type: 'fault', code: 'GIFT_UNMAPPED' });
    }
  }

  return { send, flush, receive, configurePresence: value => { settings = admissionSettings(value); } };
}
