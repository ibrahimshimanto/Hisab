import { useEffect } from 'react';
import useStore from '../../store/useStore.js';
import { downloadBackup } from '../../lib/download.js';
export default function SaveNotice() {
  const {
    user,
    syncStatus,
    syncError,
    financialError,
    clearFinancialError,
    syncToCloud,
    reloadCloudCopy,
    dataLoaded,
  } = useStore();
  useEffect(() => {
    const retry = () => {
      if (useStore.getState().syncStatus === 'error')
        useStore.getState().syncToCloud();
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);
  if (!financialError && !syncError && (!user || syncStatus === 'synced'))
    return null;
  const message =
    financialError ||
    syncError ||
    (syncStatus === 'syncing'
      ? 'Saving to cloud…'
      : 'Changes pending cloud save.');
  return (
    <aside
      className="save-notice"
      role={financialError || syncError ? 'alert' : 'status'}
    >
      <span>{message}</span>
      {financialError && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={clearFinancialError}
        >
          Dismiss
        </button>
      )}
      {user && ['error', 'pending', 'offline'].includes(syncStatus) && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => (dataLoaded ? syncToCloud() : reloadCloudCopy())}
        >
          Retry
        </button>
      )}
      {user && ['error', 'conflict'].includes(syncStatus) && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => downloadBackup(useStore.getState(), 'hisab-pending')}
        >
          Export pending backup
        </button>
      )}
      {user && syncStatus === 'conflict' && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            downloadBackup(useStore.getState(), 'hisab-before-reload');
            if (
              window.confirm(
                'A backup of your pending changes has been downloaded. Replace this device copy with the newer cloud copy?'
              )
            )
              reloadCloudCopy();
          }}
        >
          Reload cloud copy
        </button>
      )}
    </aside>
  );
}
