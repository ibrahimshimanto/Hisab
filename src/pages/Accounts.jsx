import { useState, useRef, useEffect } from 'react';
import {
  Plus, Wallet, Building2, Smartphone, Edit2, Trash2,
  ArrowRightLeft, History, SlidersHorizontal, Sparkles, CheckCircle2,
  ChevronDown, MoreVertical,
} from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import Modal from '../components/ui/Modal.jsx';
import {
  MFS_PROVIDERS,
  BANK_PROVIDERS,
  WALLET_PROVIDERS,
  ProviderLogo,
  findProvider,
} from '../lib/accountProviders.jsx';

const typeIcons = {
  mfs: Smartphone,
  bank: Building2,
  wallet: Wallet,
};

const typeColors = {
  mfs: { bg: 'var(--color-mfs-light)', color: 'var(--color-mfs)' },
  bank: { bg: 'var(--color-bank-light)', color: 'var(--color-bank)' },
  wallet: { bg: 'var(--color-wallet-light)', color: 'var(--color-wallet)' },
};

export default function Accounts() {
  const { t, formatCurrency, lang } = useTranslation();
  const {
    accounts, adjustments,
    addAccount, updateAccount, deleteAccount,
    adjustAccountBalance, transferBetweenAccounts,
    addMoneyToAccount,
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openMenuAccountId, setOpenMenuAccountId] = useState(null);

  // Form state
  const [formType, setFormType] = useState('mfs');
  const [formProviderId, setFormProviderId] = useState('bkash');
  const [formName, setFormName] = useState('');
  const [formBalance, setFormBalance] = useState('');
  const [formIncomeSource, setFormIncomeSource] = useState('salary');
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const providerDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(e.target)) {
        setProviderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Add Money state
  const [topupAccount, setTopupAccount] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupIncomeSource, setTopupIncomeSource] = useState('salary');
  const [topupNote, setTopupNote] = useState('');

  // Adjust form
  const [adjustBalance, setAdjustBalance] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Transfer form
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const matchedAccount = formName.trim()
    ? accounts.find((a) => a.name.trim().toLowerCase() === formName.trim().toLowerCase())
    : null;

  const resetForm = () => {
    setFormType('mfs');
    setFormProviderId('bkash');
    setFormName(lang === 'bn' ? 'বিকাশ' : 'bKash');
    setFormBalance('');
    setFormIncomeSource('salary');
    setEditingAccount(null);
    setProviderDropdownOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (account) => {
    setEditingAccount(account);
    setFormType(account.type);
    const prov = findProvider(account.providerId || account.name, account.type);
    setFormProviderId(prov ? prov.id : (account.type === 'mfs' ? 'bkash' : account.type === 'bank' ? 'brac' : 'cash_wallet'));
    setFormName(account.name);
    setFormBalance(String(account.balance));
    setProviderDropdownOpen(false);
    setShowAddModal(true);
  };

  const openQuickAddMoney = (account) => {
    setTopupAccount(account);
    setTopupAmount('');
    setTopupIncomeSource('salary');
    setTopupNote('');
    setShowAddMoneyModal(true);
  };

  const openAdjust = (account) => {
    setSelectedAccountId(account.id);
    setAdjustBalance(String(account.balance));
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const openHistory = (accountId) => {
    setSelectedAccountId(accountId);
    setShowHistoryModal(true);
  };

  const handleSaveAccount = () => {
    if (!formName.trim() || !formBalance) return;
    const data = {
      type: formType,
      providerId: formProviderId,
      name: formName.trim(),
      balance: parseFloat(formBalance) || 0,
      incomeSource: formIncomeSource || 'salary',
    };
    if (editingAccount) {
      updateAccount(editingAccount.id, data);
    } else {
      addAccount(data);
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleQuickAddMoney = () => {
    const amt = parseFloat(topupAmount);
    if (!topupAccount || !amt || amt <= 0) return;
    addMoneyToAccount(topupAccount.id, amt, topupIncomeSource, topupNote);
    setShowAddMoneyModal(false);
    setTopupAccount(null);
    setTopupAmount('');
    setTopupIncomeSource('salary');
    setTopupNote('');
  };

  const handleAdjust = () => {
    const newBal = parseFloat(adjustBalance);
    if (isNaN(newBal)) return;
    adjustAccountBalance(selectedAccountId, newBal, adjustReason);
    setShowAdjustModal(false);
  };

  const handleTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (!transferFrom || !transferTo || !amt || transferFrom === transferTo) return;
    transferBetweenAccounts(transferFrom, transferTo, amt);
    setShowTransferModal(false);
    setTransferFrom('');
    setTransferTo('');
    setTransferAmount('');
  };

  const handleDelete = (id) => {
    deleteAccount(id);
    setDeleteConfirm(null);
  };

  const accountAdjustments = adjustments
    .filter((a) => a.accountId === selectedAccountId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getPlaceholder = () => {
    switch (formType) {
      case 'mfs': return t('accounts.providerPlaceholder');
      case 'bank': return t('accounts.bankPlaceholder');
      default: return t('accounts.walletPlaceholder');
    }
  };

  const getNameLabel = () => {
    switch (formType) {
      case 'mfs': return t('accounts.providerName');
      case 'bank': return t('accounts.bankName');
      default: return t('accounts.walletName');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">{t('accounts.title')}</h1>
          <p className="page-subtitle">{t('accounts.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary btn-sm header-action-btn" onClick={openAdd}>
            <Plus size={16} strokeWidth={2.5} />
            <span className="btn-text-full">{t('accounts.addAccount')}</span>
            <span className="btn-text-short">{lang === 'bn' ? 'যুক্ত' : 'Add'}</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      {accounts.length > 0 && (
        <div
          className="hero-card"
          style={{
            marginBottom: 10,
            padding: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="hero-card-label" style={{ marginBottom: 4 }}>
                {t('accounts.totalAcrossAccounts')}
              </p>
              <p className="hero-card-balance" style={{ marginBottom: 0, fontSize: 'var(--text-4xl)' }}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {accounts.length >= 2 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowTransferModal(true)}
                >
                  <ArrowRightLeft size={15} />
                  <span>{t('accounts.transfer')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account List */}
      {accounts.length > 0 ? (
        <div className="stagger-children" data-tour="accounts-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map((acc) => {
            return (
              <div
                key={acc.id}
                className="card account-item-card"
              >
                {/* Top/Main Details Row */}
                <div className="account-item-main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                    <div
                      className="account-item-icon-wrap"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ProviderLogo providerId={acc.providerId} name={acc.name} type={acc.type} size={24} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="account-item-name">
                        {acc.name}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <span className={`badge badge-${acc.type}`}>{t(`accounts.${acc.type}Full`)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="account-item-balance">
                    {formatCurrency(acc.balance)}
                  </div>
                </div>

                {/* Actions Toolbar: Primary + Adjust + 3-Dot Overflow Menu */}
                <div className="account-item-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-lime account-action-btn add-money-btn"
                    onClick={() => openQuickAddMoney(acc)}
                    title={t('accounts.addMoney')}
                  >
                    <Plus size={15} />
                    <span className="action-btn-label">{t('accounts.addMoney')}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost account-action-btn"
                    onClick={() => openAdjust(acc)}
                    title={t('accounts.adjustBalance')}
                  >
                    <SlidersHorizontal size={15} />
                    <span className="action-btn-label">{t('accounts.adjustBalance')}</span>
                  </button>

                  {/* 3-Dot Overflow Menu */}
                  <div className="account-more-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost account-action-btn"
                      onClick={() => setOpenMenuAccountId(openMenuAccountId === acc.id ? null : acc.id)}
                      title={lang === 'bn' ? 'আরও অপশন' : 'More options'}
                      aria-label="More options"
                      style={{ padding: '6px 8px' }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuAccountId === acc.id && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 45 }}
                          onClick={() => setOpenMenuAccountId(null)}
                        />
                        <div className="account-more-dropdown">
                          <button
                            type="button"
                            className="account-more-item"
                            onClick={() => {
                              setOpenMenuAccountId(null);
                              openHistory(acc.id);
                            }}
                          >
                            <History size={14} />
                            <span>{t('accounts.adjustmentHistory')}</span>
                          </button>
                          <button
                            type="button"
                            className="account-more-item"
                            onClick={() => {
                              setOpenMenuAccountId(null);
                              openEdit(acc);
                            }}
                          >
                            <Edit2 size={14} />
                            <span>{t('common.edit')}</span>
                          </button>
                          <div style={{ height: 1, background: 'var(--card-inner-border, rgba(17, 20, 17, 0.08))', margin: '2px 0' }} />
                          <button
                            type="button"
                            className="account-more-item danger"
                            onClick={() => {
                              setOpenMenuAccountId(null);
                              setDeleteConfirm(acc.id);
                            }}
                          >
                            <Trash2 size={14} />
                            <span>{t('common.delete')}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Wallet size={28} /></div>
            <p className="empty-state-title">{t('accounts.noAccounts')}</p>
            <p className="empty-state-desc">{t('accounts.noAccountsDesc')}</p>
            <button className="btn btn-primary btn-lg" onClick={openAdd}>
              <Plus size={18} />
              {t('accounts.addAccount')}
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={editingAccount ? t('accounts.editAccount') : t('accounts.addAccount')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveAccount}>
              {t('common.save')}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('accounts.accountType')}</label>
          <div className="toggle-group">
            {['mfs', 'bank', 'wallet'].map((type) => (
              <button
                key={type}
                className={`toggle-option ${formType === type ? 'active' : ''}`}
                onClick={() => {
                  setFormType(type);
                  const pId = type === 'mfs' ? 'bkash' : type === 'bank' ? 'brac' : 'cash_wallet';
                  setFormProviderId(pId);
                  const list = type === 'mfs' ? MFS_PROVIDERS : type === 'bank' ? BANK_PROVIDERS : WALLET_PROVIDERS;
                  const p = list.find((item) => item.id === pId);
                  if (p && !editingAccount) {
                    setFormName(lang === 'bn' ? (p.nameBn || p.name) : p.name);
                  }
                }}
              >
                {t(`accounts.${type}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Name Dropdown (Name-only with stroke outline) */}
        <div className="form-group" style={{ position: 'relative' }} ref={providerDropdownRef}>
          <label className="form-label">
            {formType === 'mfs'
              ? (lang === 'bn' ? 'প্রোভাইডার নির্বাচন' : 'MFS Provider')
              : formType === 'bank'
              ? (lang === 'bn' ? 'ব্যাংক নির্বাচন' : 'Bank')
              : (lang === 'bn' ? 'ওয়ালেট ধরন' : 'Wallet Type')}
          </label>

          {(() => {
            const providerList = formType === 'mfs' ? MFS_PROVIDERS : formType === 'bank' ? BANK_PROVIDERS : WALLET_PROVIDERS;
            const currentProv = providerList.find((p) => p.id === formProviderId) || providerList[0];
            const currentDisplayName = formName || (currentProv ? (lang === 'bn' ? (currentProv.nameBn || currentProv.name) : currentProv.name) : '');

            return (
              <>
                <button
                  type="button"
                  className="provider-name-dropdown-trigger"
                  onClick={() => setProviderDropdownOpen((prev) => !prev)}
                  aria-expanded={providerDropdownOpen}
                >
                  <span style={{ fontSize: '13.5px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                    {currentDisplayName}
                  </span>
                  <ChevronDown
                    size={17}
                    style={{
                      transform: providerDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      color: 'var(--color-text-tertiary)',
                    }}
                  />
                </button>

                {providerDropdownOpen && (
                  <div className="provider-name-dropdown-popover">
                    {providerList.map((p) => {
                      const isSelected = formProviderId === p.id;
                      const pName = lang === 'bn' ? (p.nameBn || p.name) : p.name;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`provider-name-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setFormProviderId(p.id);
                            setFormName(pName);
                            setProviderDropdownOpen(false);
                          }}
                        >
                          <span>{pName}</span>
                          {isSelected && (
                            <CheckCircle2 size={16} style={{ color: '#5ED21C', flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Existing Account Auto-update Notice */}
        {matchedAccount && !editingAccount && (
          <div style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(94, 210, 28, 0.12)',
            border: '1px solid rgba(94, 210, 28, 0.3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Sparkles size={15} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
            <span>
              {t('accounts.existingAccountNotice')} ({formatCurrency(matchedAccount.balance)} + {formatCurrency(parseFloat(formBalance) || 0)} = <strong style={{ color: 'var(--color-primary-dark)' }}>{formatCurrency((matchedAccount.balance || 0) + (parseFloat(formBalance) || 0))}</strong>)
            </span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{matchedAccount && !editingAccount ? t('accounts.amount') : t('accounts.initialBalance')}</label>
          <input
            className="form-input"
            type="number"
            value={formBalance}
            onChange={(e) => setFormBalance(e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Source of Income Dropdown */}
        {!editingAccount && (
          <div className="form-group">
            <label className="form-label">{t('accounts.incomeSource')}</label>
            <select
              className="form-input form-select"
              value={formIncomeSource}
              onChange={(e) => setFormIncomeSource(e.target.value)}
            >
              <option value="salary">{t('accounts.sourcesOfIncome.salary')}</option>
              <option value="gift">{t('accounts.sourcesOfIncome.gift')}</option>
              <option value="freelance">{t('accounts.sourcesOfIncome.freelance')}</option>
              <option value="business">{t('accounts.sourcesOfIncome.business')}</option>
              <option value="investment">{t('accounts.sourcesOfIncome.investment')}</option>
              <option value="other">{t('accounts.sourcesOfIncome.other')}</option>
            </select>
          </div>
        )}
      </Modal>

      {/* Quick Add Money Modal */}
      <Modal
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        title={`${t('accounts.addMoney')} — ${topupAccount?.name || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddMoneyModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-lime" onClick={handleQuickAddMoney}>
              {t('accounts.addMoney')}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('accounts.amount')}</label>
          <input
            className="form-input"
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('accounts.incomeSource')}</label>
          <select
            className="form-input form-select"
            value={topupIncomeSource}
            onChange={(e) => setTopupIncomeSource(e.target.value)}
          >
            <option value="salary">{t('accounts.sourcesOfIncome.salary')}</option>
            <option value="gift">{t('accounts.sourcesOfIncome.gift')}</option>
            <option value="freelance">{t('accounts.sourcesOfIncome.freelance')}</option>
            <option value="business">{t('accounts.sourcesOfIncome.business')}</option>
            <option value="investment">{t('accounts.sourcesOfIncome.investment')}</option>
            <option value="other">{t('accounts.sourcesOfIncome.other')}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t('accounts.reason')}</label>
          <input
            className="form-input"
            type="text"
            value={topupNote}
            onChange={(e) => setTopupNote(e.target.value)}
            placeholder={t('accounts.reasonPlaceholder')}
          />
        </div>
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={t('accounts.adjustBalance')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleAdjust}>
              {t('common.confirm')}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('accounts.newBalance')}</label>
          <input
            className="form-input"
            type="number"
            value={adjustBalance}
            onChange={(e) => setAdjustBalance(e.target.value)}
          />
          <div className="quick-increment-chips">
            {[500, 1000, 5000].map((amt) => (
              <button
                key={`add-${amt}`}
                type="button"
                className="quick-increment-chip"
                onClick={() => setAdjustBalance(String(Math.max(0, (Number(adjustBalance) || 0) + amt)))}
              >
                +৳{amt.toLocaleString('en-US')}
              </button>
            ))}
            {[500, 1000].map((amt) => (
              <button
                key={`sub-${amt}`}
                type="button"
                className="quick-increment-chip"
                onClick={() => setAdjustBalance(String(Math.max(0, (Number(adjustBalance) || 0) - amt)))}
              >
                -৳{amt.toLocaleString('en-US')}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('accounts.reason')}</label>
          <input
            className="form-input"
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder={t('accounts.reasonPlaceholder')}
          />
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={t('accounts.transferBetween')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleTransfer}>
              {t('common.confirm')}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('accounts.fromAccount')}</label>
          <select className="form-input form-select" value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}>
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('accounts.toAccount')}</label>
          <select className="form-input form-select" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
            <option value="">—</option>
            {accounts.filter((a) => a.id !== transferFrom).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('accounts.amount')}</label>
          <input className="form-input" type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0" />
        </div>
      </Modal>

      {/* Adjustment History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={t('accounts.adjustmentHistory')}
      >
        {accountAdjustments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {accountAdjustments.map((adj) => (
              <div key={adj.id} style={{ padding: 'var(--space-3)', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(adj.previousBalance)}</span>
                  <span>→</span>
                  <span style={{ fontWeight: 'var(--weight-semibold)' }}>{formatCurrency(adj.newBalance)}</span>
                </div>
                {adj.reason && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>{adj.reason}</p>}
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                  {new Date(adj.date).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-6)' }}>
            {t('common.noData')}
          </p>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('accounts.deleteAccount')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
              {t('common.delete')}
            </button>
          </>
        }
      >
        <p className="confirm-message">{t('accounts.deleteConfirm')}</p>
      </Modal>
    </div>
  );
}
