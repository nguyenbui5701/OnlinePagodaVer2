import { inScope, isFinalGift, kinds, mapEvent } from './mapper.mjs';

export const rejectKeys = ['noRoom', 'wrongRoom', 'time', 'schema', 'identity', 'message'];
const counters = keys => Object.fromEntries(keys.map(key => [key, 0]));
export const ingressKeys = [...kinds, ...rejectKeys, 'mapped', 'handoff', 'ipcPressure', 'ipcError'];
export const newIngress = () => counters(ingressKeys);

export function createIngress(transmit, exit) {
  const metrics = newIngress();
  let inFlight = 0;
  let halted = false;
  let previous = '';

  function send(message, priority = 'control') {
    if (halted) return;
    const critical = priority === 'control' || priority === 'final';
    const cap = critical ? 256 : priority === 'identity' ? 240 : 208;
    if (inFlight >= cap) {
      if (message.type === 'event') metrics.ipcPressure++;
      if (critical) {
        halted = true;
        if (!transmit({ type: 'fault', code: 'GIFT_DELIVERY_FAILED' }, error => { if (error) exit(2); })) exit(2);
      }
      return;
    }
    inFlight++;
    const complete = error => {
      inFlight--;
      if (!error) return;
      if (message.type === 'event') { metrics.handoff--; metrics.ipcError++; }
      if (critical) exit(2);
    };
    if (message.type === 'event') metrics.handoff++;
    if (!transmit(message, complete)) complete(new Error('IPC closed'));
  }

  function flush() {
    const wire = JSON.stringify(metrics);
    if (wire === previous || halted || inFlight >= 240) return;
    previous = wire;
    send({ type: 'ingress', counts: JSON.parse(wire) }, 'identity');
  }

  function receive(kind, packet, room, startedAt, now = Date.now()) {
    metrics[kind]++;
    const event = mapEvent(kind, packet, room, startedAt, now, reason => metrics[reason]++);
    if (event) {
      metrics.mapped++;
      send({ type: 'event', event }, event.phase === 'final' ? 'final' : event.viewer && event.type !== 'gift' ? 'identity' : 'aggregate');
    } else if (kind === 'gift' && isFinalGift(packet) && inScope(packet, room, startedAt, now)) {
      flush();
      send({ type: 'fault', code: 'GIFT_UNMAPPED' });
    }
  }

  return { send, flush, receive };
}
