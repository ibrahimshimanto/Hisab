import { useState, useRef } from 'react';
import useStore from '../../store/useStore.js';
import { parseBackup } from '../../lib/backup.js';
import { reviewData } from '../../lib/accounting.js';
import { downloadJSON, downloadBackup } from '../../lib/download.js';
import Modal from '../ui/Modal.jsx';
export default function DataTools() {
  const state = useStore();
  const input = useRef();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState(null);
  const issues = reviewData(state);
  const readBackup = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error('Choose a backup smaller than 20 MB.');
      setPreview(parseBackup(await file.text()));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };
  const legacy = Boolean(localStorage.getItem('hisab-data'));
  return (
    <div style={{ display: 'grid', gap: 12, padding: '16px 0' }}>
      <p>
        A full JSON backup includes accounts, transactions, budgets, savings,
        bills, categories, adjustments, profile, and preferences. CSV contains
        transaction records only.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => downloadBackup(state)}
        >
          Export full backup
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => input.current.click()}
        >
          Restore full backup
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowReview(true)}
        >
          Review historical records ({issues.length})
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        onChange={readBackup}
        hidden
      />
      {legacy && (
        <div>
          <p>
            An older device copy has been preserved separately. Its account
            owner could not be verified, so it has not been uploaded
            automatically.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              downloadJSON(
                JSON.parse(localStorage.getItem('hisab-data')),
                'hisab-legacy-device-copy.json'
              )
            }
          >
            Export older device copy
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <Modal
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Review backup restore"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setPreview(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                downloadBackup(state, 'hisab-before-restore');
                if (state.restoreBackup(preview.data)) setPreview(null);
              }}
            >
              Preserve current copy & restore
            </button>
          </>
        }
      >
        <p>
          This replaces the current account's financial records and preferences
          with the backup. Your current copy will be downloaded and preserved
          before the replacement is saved.
        </p>
        {preview && (
          <>
            <p>
              {preview.summary.accounts} accounts ·{' '}
              {preview.summary.transactions} transactions ·{' '}
              {preview.summary.budgets} budgets · {preview.summary.goals}{' '}
              savings goals · {preview.summary.bills} bills
            </p>
            <p>
              Total account balance: ৳{preview.summary.liquidTotal.toFixed(2)}
            </p>
            <p>
              {preview.issues.length} historical records need review. No
              balances are recalculated automatically.
            </p>
          </>
        )}
      </Modal>
      <Modal
        isOpen={showReview}
        onClose={() => {
          setShowReview(false);
          setReview(null);
        }}
        title="Review historical records"
        footer={
          <button
            className="btn btn-secondary"
            onClick={() => setShowReview(false)}
          >
            Close
          </button>
        }
      >
        <p>
          Original records are preserved. Review changes only the classification
          or missing account link; balances stay unchanged. Use a separate
          balance adjustment with a reason if needed.
        </p>
        {!issues.length && <p>No flagged historical records.</p>}
        {issues.map((issue, i) => {
          const t = state.transactions.find((x) => x.id === issue.id);
          return (
            <div
              key={`${issue.id}-${i}`}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <p>
                {t.date} · ৳{t.amount} · {t.description || t.note || t.id}
              </p>
              <p>{issue.reason}</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setReview({
                    id: t.id,
                    accountId: t.accountId || '',
                    kind: t.kind || t.type,
                  })
                }
              >
                Review this record
              </button>
            </div>
          );
        })}
        {review && (
          <div style={{ paddingTop: 16 }}>
            <label htmlFor="review-account">Account link</label>
            <select
              id="review-account"
              className="form-input"
              value={review.accountId}
              onChange={(e) =>
                setReview({ ...review, accountId: e.target.value })
              }
            >
              <option value="">Choose the original account</option>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <label htmlFor="review-kind">Classification</label>
            <select
              id="review-kind"
              className="form-input"
              value={review.kind}
              onChange={(e) => setReview({ ...review, kind: e.target.value })}
            >
              {[
                'income',
                'expense',
                'opening',
                'savings',
                'transfer',
                'refund',
              ].map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
            <p>
              Preview: account balances will not change. Income and spending
              totals will use the selected classification.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (
                  state.reviewLegacyTransaction(review.id, {
                    accountId: review.accountId,
                    kind: review.kind,
                  })
                )
                  setReview(null);
              }}
            >
              Confirm reviewed classification and link
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
