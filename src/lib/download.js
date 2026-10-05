import { createBackup } from './backup.js';
import { localDateString } from './accounting.js';
export function downloadJSON(data, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
export function downloadBackup(state, prefix = 'hisab-backup') {
  downloadJSON(createBackup(state), `${prefix}-${localDateString()}.json`);
}
