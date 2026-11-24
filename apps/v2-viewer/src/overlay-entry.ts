import { postGateway, readSettings } from './live-api.ts';
import { overlayContext } from './overlay-context.ts';
import { overlayQuery } from './live-settings.ts';

async function startOverlay() {
  try {
    const snapshot = readSettings(await (await postGateway('/settings')).json());
    overlayContext.settings = { query: overlayQuery(snapshot.settings), revision: snapshot.revision };
  } catch {
    document.querySelector('#status')!.textContent = 'Đang chờ cấu hình từ Gateway cục bộ. Kiểm tra npm.cmd start ở cổng 5203.';
    setTimeout(() => void startOverlay(), 2000);
    return;
  }
  await import('./main.ts');
}

void startOverlay().catch(() => {
  document.querySelector('#status')!.textContent = 'Không khởi tạo được Overlay. Tải lại trang để thử lại.';
});