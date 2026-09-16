import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import Modal from '../components/ui/Modal.jsx';

export default function Budgets() {
  const { t, formatCurrency, lang } = useTranslation();
  const { budgets, transactions, categories, addBudget, updateBudget, deleteBudget } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formLimit, setFormLimit] = useState('');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const categorySpending = useMemo(() => {
    const expenses = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && t.type === 'expense';
    });
    const spending = {};
    expenses.forEach((t) => {
      spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount;
    });
    return spending;
  }, [transactions, currentYear, currentMonth]);

  const totalBudget = budgets.reduce((sum, b) => sum + (Number(b.limit ?? b.amount) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (categorySpending[b.categoryId] || 0), 0);
  const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const getCategoryInfo = (categoryId) => {
    const allCats = [...(categories.expense || []), ...(categories.income || [])];
    return allCats.find((c) => c.id === categoryId);
  };

  const getCategoryLabel = (categoryId) => {
    const cat = getCategoryInfo(categoryId);
    if (!cat) return categoryId;
    if (cat.custom) return cat.label;
    return t(`categories.expense.${cat.key}`) || categoryId;
  };

  // Only expense categories that don't have a budget yet
  const availableCategories = useMemo(() => {
    const existingIds = new Set(budgets.map((b) => b.categoryId));
    if (editingBudget) existingIds.delete(editingBudget.categoryId);
    return (categories.expense || []).filter((c) => !existingIds.has(c.id));
  }, [budgets, categories, editingBudget]);

  const resetForm = () => {
    setFormCategoryId('');
    setFormLimit('');
    setEditingBudget(null);
  };

  const openAdd = () => {
    resetForm();
    if (availableCategories.length > 0) {
      setFormCategoryId(availableCategories[0].id);
    }
    setShowAddModal(true);
  };

  const openEdit = (budget) => {
    setEditingBudget(budget);
    setFormCategoryId(budget.categoryId);
    setFormLimit(String(budget.limit ?? budget.amount ?? ''));
    setShowAddModal(true);
  };

  const handleSave = () => {
    const limit = parseFloat(formLimit);
    if (!formCategoryId || !limit) return;

    if (editingBudget) {
      updateBudget(editingBudget.id, { categoryId: formCategoryId, limit, amount: limit });
    } else {
      addBudget({ categoryId: formCategoryId, limit, amount: limit });
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (id) => {
    deleteBudget(id);
    setDeleteConfirm(null);
  };

  const getStatus = (spent, limit) => {
    if (!limit || limit <= 0) return spent > 0 ? 'over-budget' : 'on-track';
    const pct = (spent / limit) * 100;
    if (pct >= 100) return 'over-budget';
    if (pct >= 80) return 'near-limit';
    return 'on-track';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'over-budget': return t('budgets.overBudget');
      case 'near-limit': return t('budgets.nearLimit');
      default: return t('budgets.onTrack');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'over-budget': return <AlertTriangle size={14} />;
      case 'near-limit': return <AlertCircle size={14} />;
      default: return <CheckCircle size={14} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'over-budget': return 'var(--color-expense)';
      case 'near-limit': return 'var(--color-warning)';
      default: return 'var(--color-income)';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">{t('budgets.title')}</h1>
          <p className="page-subtitle">{t('budgets.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary btn-sm header-action-btn" onClick={openAdd}>
            <Plus size={16} strokeWidth={2.5} />
            <span className="btn-text-full">{t('budgets.addBudget')}</span>
            <span className="btn-text-short">{lang === 'bn' ? 'বাজেট' : 'Budget'}</span>
          </button>
        </div>
      </div>

      {/* Overall Budget Health */}
      {budgets.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('budgets.overallUtilization')}
              </p>
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)' }}>
                {formatCurrency(totalSpent)} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-regular)' }}>/ {formatCurrency(totalBudget)}</span>
              </p>
            </div>
            <div style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              color: getStatusColor(getStatus(totalSpent, totalBudget)),
            }}>
              {Math.round(overallUtilization)}%
            </div>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className={`progress-bar-fill ${getStatus(totalSpent, totalBudget)}`}
              style={{ width: `${Math.min(overallUtilization, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget List (Responsive Multi-Column Card Grid) */}
      {budgets.length > 0 ? (
        <div className="budget-cards-grid" data-tour="budgets-grid">
          {budgets.map((budget) => {
            const limit = Number(budget.limit ?? budget.amount) || 0;
            const spent = categorySpending[budget.categoryId] || 0;
            const remaining = limit - spent;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const status = getStatus(spent, limit);
            const cat = getCategoryInfo(budget.categoryId);
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const daysLeft = Math.max(1, daysInMonth - now.getDate());
            const dailyRemaining = remaining > 0 ? Math.round(remaining / daysLeft) : 0;

            return (
              <div key={budget.id} className="budget-card-modern animate-fade-in-up">
                {/* Header: Category + Status Badge + Actions */}
                <div className="budget-card-top">
                  <div className="budget-card-cat">
                    <div className="budget-cat-pill" style={{ background: cat?.color || 'var(--color-text-tertiary)' }} />
                    <span className="budget-card-cat-name">{getCategoryLabel(budget.categoryId)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="badge" style={{
                      background: `${getStatusColor(status)}15`,
                      color: getStatusColor(status),
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 7px',
                    }}>
                      {getStatusIcon(status)}
                      <span>{getStatusLabel(status)}</span>
                    </span>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(budget)} title={t('common.edit')}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setDeleteConfirm(budget.id)} style={{ color: 'var(--color-expense)' }} title={t('common.delete')}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Spent Figure & Utilization */}
                <div>
                  <div className="budget-card-stats">
                    <span className="budget-card-spent">{formatCurrency(spent)}</span>
                    <span className="budget-card-limit">/ {formatCurrency(limit)} ({pct}%)</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar" style={{ height: 8, marginTop: 8 }}>
                    <div
                      className={`progress-bar-fill ${status}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer: Remaining Amount & Daily Pace */}
                <div className="budget-card-pace">
                  <span style={{ color: remaining >= 0 ? 'var(--color-text-secondary)' : 'var(--color-expense)', fontWeight: 600 }}>
                    {remaining >= 0 ? `${t('budgets.remaining')}: ${formatCurrency(remaining)}` : `${t('budgets.overBudget')}: ${formatCurrency(Math.abs(remaining))}`}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    {remaining > 0
                      ? (lang === 'bn' ? `দৈনিক ৳${dailyRemaining.toLocaleString('bn-BD')} (${daysLeft} দিন)` : `৳${dailyRemaining.toLocaleString('en-US')}/day (${daysLeft}d left)`)
                      : (lang === 'bn' ? 'বাজেট সমাপ্ত' : 'Depleted')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><AlertCircle size={28} /></div>
            <p className="empty-state-title">{t('budgets.noBudgets')}</p>
            <p className="empty-state-desc">{t('budgets.noBudgetsDesc')}</p>
            <button className="btn btn-primary btn-lg" onClick={openAdd}>
              <Plus size={18} />
              {t('budgets.addBudget')}
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={editingBudget ? t('budgets.editBudget') : t('budgets.addBudget')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave}>{t('common.save')}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('budgets.category')}</label>
          <select className="form-input form-select" value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}>
            <option value="">{lang === 'bn' ? '-- ক্যাটাগরি বাছাই করুন --' : '-- Select Category --'}</option>
            {(editingBudget
              ? (categories.expense || [])
              : availableCategories
            ).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.custom ? cat.label : t(`categories.expense.${cat.key}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('budgets.monthlyLimit')}</label>
          <input className="form-input" type="number" value={formLimit} onChange={(e) => setFormLimit(e.target.value)} placeholder={t('budgets.limitPlaceholder')} />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('budgets.deleteBudget')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>{t('common.delete')}</button>
          </>
        }
      >
        <p className="confirm-message">{t('budgets.deleteConfirm')}</p>
      </Modal>
    </div>
  );
}
