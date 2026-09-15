import { useState, useMemo } from 'react';
import {
  Sparkles, X, ShieldCheck, AlertTriangle, TrendingUp,
  Compass, ChevronRight, HelpCircle, ArrowRight, CheckCircle2,
  Calendar, Zap, DollarSign
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import { analyzeFinancialHealth } from '../../utils/aiAdvisor.js';
import Modal from '../ui/Modal.jsx';
import { useNavigate } from 'react-router-dom';

export default function AiAdvisorModal({ isOpen, onClose }) {
  const { t, lang, formatCurrency } = useTranslation();
  const navigate = useNavigate();
  const {
    accounts,
    transactions,
    budgets,
    savingsGoals,
    financialMode,
    modeSettings,
    profile,
  } = useStore();

  const [selectedPromptKey, setSelectedPromptKey] = useState('whereDidMoneyGo');

  const analysis = useMemo(() => {
    return analyzeFinancialHealth({
      accounts,
      transactions,
      budgets,
      savingsGoals,
      financialMode,
      modeSettings,
      monthlySalary: profile?.monthlySalary || 0,
      lang,
    });
  }, [accounts, transactions, budgets, savingsGoals, financialMode, modeSettings, profile, lang]);

  if (!isOpen) return null;

  const currentAnswer = analysis.queryAnswers[selectedPromptKey];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #5ED21C 0%, #47A514 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111411',
              boxShadow: '0 4px 12px rgba(94, 210, 28, 0.4)',
            }}
          >
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
              {lang === 'bn' ? 'হিসাব এআই আর্থিক উপদেষ্টা' : 'Hisab AI Financial Advisor'}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {lang === 'bn' ? 'লাইভ অ্যালগরিদম ভিত্তিক বিশ্লেষণ ও পরামর্শ' : 'Real-time algorithmic intelligence & guidance'}
            </div>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* 1. Health Score Executive Card */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(17, 20, 17, 0.95) 0%, rgba(26, 32, 26, 0.95) 100%)',
            border: '1px solid rgba(94, 210, 28, 0.3)',
            color: '#F4F7F2',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', fontWeight: 'var(--weight-bold)' }}>
                {lang === 'bn' ? 'আর্থিক স্বাস্থ্য স্কোর' : 'Financial Health Index'}
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: '#FFFFFF', marginTop: 2 }}>
                {analysis.score}<span style={{ fontSize: 'var(--text-md)', color: '#64748B' }}> / 100</span>
              </div>
            </div>
            <div
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(94, 210, 28, 0.16)',
                border: '1px solid rgba(94, 210, 28, 0.4)',
                color: '#9EFF33',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-bold)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ShieldCheck size={14} />
              <span>{analysis.scoreLabel}</span>
            </div>
          </div>

          {/* Quick 3 Pillar Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>{lang === 'bn' ? 'তরল রিজার্ভ রানওয়ে' : 'Liquid Runway'}</span>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: '#FFFFFF' }}>{analysis.runwayMonths} mo</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>{lang === 'bn' ? 'সঞ্চয় হার' : 'Savings Pace'}</span>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: '#9EFF33' }}>{analysis.savingsRate}%</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>{lang === 'bn' ? 'দৈনিক নিরাপদ ব্যয়' : 'Daily Allowance'}</span>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: '#FFFFFF' }}>{formatCurrency(analysis.avgDailyBurn)}</div>
            </div>
          </div>
        </div>

        {/* 2. Interactive AI Prompt Questions */}
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {lang === 'bn' ? 'এআই-কে প্রশ্ন করুন' : 'Ask Hisab Intelligence'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(analysis.queryAnswers).map(([key, item]) => {
              const isActive = selectedPromptKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPromptKey(key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 'var(--weight-medium)',
                    background: isActive ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                    color: isActive ? '#111411' : 'var(--color-text-primary)',
                    border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {item.question}
                </button>
              );
            })}
          </div>

          {/* Computed Prompt Response Card */}
          {currentAnswer && (
            <div
              className="animate-scale-in"
              style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary-dark)' }}>
                  {currentAnswer.question}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>
                {currentAnswer.answer}
              </p>

              {currentAnswer.highlights && (
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {currentAnswer.highlights.map((h, i) => (
                    <div key={i} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', fontSize: '11px', border: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{h.label}: </span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(h.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Real-Time Prioritized Diagnostic Insights Feed */}
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {lang === 'bn' ? 'সক্রিয় পর্যবেক্ষণ ও সুপারিশ' : 'Active Diagnoses & Opportunities'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {analysis.insights.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--glass-bg-card)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '10px',
                      fontWeight: 'var(--weight-bold)',
                      background: item.type === 'alert' ? 'rgba(244, 63, 94, 0.14)' : 'rgba(94, 210, 28, 0.14)',
                      color: item.type === 'alert' ? '#F43F5E' : 'var(--color-primary-dark)',
                    }}
                  >
                    {item.badge}
                  </div>
                  {item.metric && (
                    <span style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: item.type === 'alert' ? '#F43F5E' : 'var(--color-primary-dark)' }}>
                      {item.metric}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                  {item.title}
                </div>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {item.desc}
                </p>

                {item.action && (
                  <button
                    type="button"
                    className="btn btn-sm btn-lime"
                    onClick={() => {
                      onClose();
                      navigate(item.action.route);
                    }}
                    style={{ alignSelf: 'flex-start', marginTop: 4, padding: '4px 10px', fontSize: '11px' }}
                  >
                    <span>{item.action.label}</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
