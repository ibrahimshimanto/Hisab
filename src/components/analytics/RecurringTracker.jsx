import { useMemo } from 'react';
import {
  RefreshCw, CheckCircle2, AlertCircle, Calendar,
  CreditCard, ExternalLink, Zap, Plus
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function RecurringTracker({ onLogBill }) {
  const { t, lang, formatCurrency } = useTranslation();
  const { transactions } = useStore();

  // Preset recurring bills or extracted from transactions
  const recurringSubscriptions = useMemo(() => {
    const knownPresets = [
      {
        id: 'rec-rent',
        name: lang === 'bn' ? 'বাড়ি ভাড়া (Monthly Rent)' : 'Home Rent',
        amount: 22000,
        dueDay: 5,
        category: 'rent',
        icon: '🏠',
        cycle: 'monthly',
      },
      {
        id: 'rec-internet',
        name: lang === 'bn' ? 'ব্রডব্যান্ড ইন্টারনেট (Dot Internet)' : 'Broadband Fiber Wifi',
        amount: 1200,
        dueDay: 10,
        category: 'utilities',
        icon: '🌐',
        cycle: 'monthly',
      },
      {
        id: 'rec-electricity',
        name: lang === 'bn' ? 'বিদ্যুৎ বিল (DESCO / DPDC)' : 'Electricity Bill (DESCO)',
        amount: 3200,
        dueDay: 15,
        category: 'utilities',
        icon: '⚡',
        cycle: 'monthly',
      },
      {
        id: 'rec-netflix',
        name: lang === 'bn' ? 'নেটফ্লিক্স ও স্ট্রিমিং' : 'Netflix UHD Subscription',
        amount: 1450,
        dueDay: 22,
        category: 'subscriptions',
        icon: '🎬',
        cycle: 'monthly',
      },
    ];

    const today = new Date();
    const currentDay = today.getDate();

    return knownPresets.map((sub) => {
      let isPaid = false;
      let daysRemaining = sub.dueDay - currentDay;

      // Check if transaction exists for this category this month
      const foundTxn = transactions.find((t) => {
        const d = new Date(t.date);
        return (
          t.type === 'expense' &&
          (t.categoryId === sub.category || (t.note && t.note.toLowerCase().includes(sub.category))) &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      });

      if (foundTxn) {
        isPaid = true;
      }

      return {
        ...sub,
        isPaid,
        daysRemaining: daysRemaining >= 0 ? daysRemaining : 30 + daysRemaining,
      };
    });
  }, [transactions, lang]);

  const totalCommitted = recurringSubscriptions.reduce((sum, s) => sum + s.amount, 0);
  const paidCount = recurringSubscriptions.filter((s) => s.isPaid).length;

  return (
    <div className="card" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              {lang === 'bn' ? 'নিয়মিত বিল ও সাবস্ক্রিপশন ট্র্যাকার' : 'Recurring Bills & Subscriptions'}
            </h3>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 'var(--weight-bold)',
                background: 'rgba(94, 210, 28, 0.16)',
                color: 'var(--color-primary-dark)',
              }}
            >
              {paidCount} / {recurringSubscriptions.length} {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
            </span>
          </div>
          <p className="card-subtitle" style={{ margin: '3px 0 0' }}>
            {lang === 'bn' ? 'মাসিক নিশ্চিত প্রতিশ্রুতির সময়মতো ট্র্যাকিং' : 'Auto-monitored regular monthly financial obligations'}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            {lang === 'bn' ? 'মোট নিয়মিত দায়' : 'Total Monthly Outflow'}
          </span>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
            {formatCurrency(totalCommitted)}
          </div>
        </div>
      </div>

      {/* Grid of Subscriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
        {recurringSubscriptions.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    {lang === 'bn' ? `প্রতি মাসের ${item.dueDay} তারিখ` : `Due every ${item.dueDay}th`}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                  {formatCurrency(item.amount)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--glass-border-subtle)' }}>
              {item.isPaid ? (
                <span style={{ fontSize: '11px', color: 'var(--color-income)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} />
                  {lang === 'bn' ? 'চলতি মাসে পরিশোধিত' : 'Paid for this cycle'}
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={13} />
                  {lang === 'bn' ? `${item.daysRemaining} দিন বাকি` : `Due in ${item.daysRemaining} days`}
                </span>
              )}

              {!item.isPaid && onLogBill && (
                <button
                  type="button"
                  className="btn btn-sm btn-lime"
                  onClick={() => onLogBill(item)}
                  style={{ padding: '2px 8px', fontSize: '10px' }}
                >
                  <Plus size={12} />
                  <span>{lang === 'bn' ? 'পরিশোধ করুন' : 'Pay Now'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
