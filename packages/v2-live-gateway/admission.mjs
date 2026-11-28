import { presenceDefaults } from '../v2-events/src/presence.ts';

const sources = { member: 'autoJoinMember', chat: 'autoJoinChat', like: 'autoJoinLike' };

export function admissionSettings(settings = presenceDefaults) {
  return {
    autoJoinMember: settings.autoJoinMember === true,
    autoJoinChat: settings.autoJoinChat === true,
    autoJoinLike: settings.autoJoinLike === true,
  };
}

export function admissionTier(event, settings) {
  return event.viewer?.userKey && Object.hasOwn(sources, event.type) && settings[sources[event.type]]
    ? event.type : 'activity';
}
