const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });

export function avatarInitial(name: string) {
  return [...segmenter.segment(name)].find(({ segment }) => /[\p{L}\p{N}]/u.test(segment))
    ?.segment.toLocaleUpperCase('vi') ?? '•';
}

// The approved photo allowlist is empty. No avatar URL reaches a browser sink.
export function setAvatarBadge(tag: HTMLElement, name: string) {
  const badge = document.createElement('span');
  badge.className = 'avatar-badge';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = avatarInitial(name);
  tag.replaceChildren(badge, document.createTextNode(name));
}
