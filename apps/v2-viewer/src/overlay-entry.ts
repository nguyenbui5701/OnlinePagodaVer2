import { postGateway, readSettings } from './live-api.ts';
import { overlayContext } from './overlay-context.ts';
import { overlayQuery } from './live-settings.ts';

try {
  const snapshot = readSettings(await (await postGateway('/settings')).json());
  overlayContext.query = overlayQuery(snapshot.settings);
  overlayContext.revision = snapshot.revision;
} catch {
  // The offline scene remains usable while the local Gateway starts.
}
await import('./main.ts');