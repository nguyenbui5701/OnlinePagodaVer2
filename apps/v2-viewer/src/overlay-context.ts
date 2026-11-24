import { liveDefaults, overlayQuery } from './live-settings.ts';

export const overlayContext = { revision: 0, query: overlayQuery(liveDefaults) };