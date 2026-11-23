import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { capture } from './camera.ts';
import { giftLabel } from './slice-driver.ts';
import type { SliceDriver } from './slice-driver.ts';
import type { ActorTarget } from './seat-scene.ts';
import { setAvatarBadge } from './avatar-badge.ts';

const name = document.querySelector<HTMLDivElement>('#gift-name')!;
const fx = document.querySelector<HTMLDivElement>('#gift-fx')!;
const fallback = document.querySelector<HTMLDivElement>('#gift-fallback')!;
type Presentation = ReturnType<SliceDriver['update']>;

function project(element: HTMLElement, anchor: Object3D, camera: PerspectiveCamera, margin: number) {
  const position = anchor.getWorldPosition(new Vector3()).project(camera);
  const x = (position.x + 1) / 2;
  const y = (1 - position.y) / 2;
  element.hidden = position.z < -1 || position.z > 1 || x < margin || x > 1 - margin || y < margin || y > 1 - margin;
  element.style.left = `${x * 100}%`;
  element.style.top = `${y * 100}%`;
}

export function showGift(camera: PerspectiveCamera, presentation: Presentation, target?: ActorTarget, presence = false) {
  const { state, active, overlay } = presentation;
  const visible = target && active && state.camera.mode === 'GIFT_FOCUS';
  name.hidden = fx.hidden = !visible;
  if (visible) {
    if (!presence) name.textContent = target.presentation.displayName;
    else if (name.lastChild?.textContent !== target.presentation.displayName || !name.firstElementChild) {
      setAvatarBadge(name, target.presentation.displayName);
    }
    fx.textContent = giftLabel(active);
    project(name, target.seat.name, camera, capture.safeMargin);
    project(fx, target.seat.fx, camera, 0.02);
  } else if (presence && name.hasChildNodes()) name.textContent = '';
  const message = overlay ?? (!target && state.focus ? active : undefined);
  fallback.hidden = !message;
  if (message) fallback.textContent = `${message.displayName} · ${giftLabel(message)}`;
  return { name: name.hidden ? undefined : target?.presentation.displayName, fx: fx.hidden ? undefined : fx.textContent,
    fallback: fallback.hidden ? undefined : fallback.textContent };
}
