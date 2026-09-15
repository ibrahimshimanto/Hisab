import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Eye,
  Sliders,
  Wallet,
  PiggyBank,
  Settings,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function TourGuide() {
  const { t, lang } = useTranslation();
  const { isTourOpen, tourStep, nextTourStep, prevTourStep, endTour, setTourStep } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [targetRect, setTargetRect] = useState(null);

  const steps = useMemo(() => [
    {
      route: '/',
      target: '[data-tour="hero-card"]',
      fallbackTarget: '.hero-card',
      title: t('tour.step1Title'),
      desc: t('tour.step1Desc'),
      icon: Eye,
      tag: '01 / 05',
    },
    {
      route: '/',
      target: '[data-tour="financial-mode"]',
      fallbackTarget: '.financial-mode-card',
      title: t('tour.step2Title'),
      desc: t('tour.step2Desc'),
      icon: Sliders,
      tag: '02 / 05',
    },
    {
      route: '/accounts',
      target: '[data-tour="accounts-list"]',
      fallbackTarget: '.account-item-card',
      title: t('tour.step3Title'),
      desc: t('tour.step3Desc'),
      icon: Wallet,
      tag: '03 / 05',
    },
    {
      route: '/savings',
      target: '[data-tour="savings-grid"]',
      fallbackTarget: '.savings-summary-grid',
      title: t('tour.step4Title'),
      desc: t('tour.step4Desc'),
      icon: PiggyBank,
      tag: '04 / 05',
    },
    {
      route: '/settings',
      target: '[data-tour="settings-group"]',
      fallbackTarget: '.settings-group',
      title: t('tour.step5Title'),
      desc: t('tour.step5Desc'),
      icon: Settings,
      tag: '05 / 05',
    },
  ], [t]);

  const currentStep = steps[tourStep] || steps[0];

  // Auto-navigate to step route if needed
  useEffect(() => {
    if (!isTourOpen || !currentStep) return;
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isTourOpen, currentStep, location.pathname, navigate]);

  const updateSpotlight = useCallback(() => {
    if (!isTourOpen || !currentStep) return;

    let attempts = 0;
    const maxAttempts = 12;

    const tryLocate = () => {
      const el = document.querySelector(currentStep.target) ||
                 (currentStep.fallbackTarget ? document.querySelector(currentStep.fallbackTarget) : null);

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: Math.max(8, rect.top - 8),
          left: Math.max(8, rect.left - 8),
          width: rect.width + 16,
          height: rect.height + 16,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryLocate, 80);
      } else {
        setTargetRect(null);
      }
    };

    tryLocate();
  }, [isTourOpen, currentStep]);

  useEffect(() => {
    if (!isTourOpen) return;
    const timer = setTimeout(() => {
      updateSpotlight();
    }, 100);

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [isTourOpen, tourStep, location.pathname, updateSpotlight]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        endTour();
      } else if (e.key === 'ArrowRight') {
        if (tourStep < steps.length - 1) nextTourStep();
        else endTour();
      } else if (e.key === 'ArrowLeft') {
        if (tourStep > 0) prevTourStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, tourStep, steps.length, nextTourStep, prevTourStep, endTour]);

  if (!isTourOpen) return null;

  const isLast = tourStep === steps.length - 1;
  const StepIcon = currentStep.icon;

  return (
    <div className={`tour-overlay-container animate-fade-in ${!targetRect ? 'tour-no-target' : ''}`} onClick={endTour}>
      {/* Cutout Spotlight Highlight Box */}
      {targetRect && (
        <div
          className="tour-spotlight-box animate-scale-in"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Floating Guided Card */}
      <div
        className="tour-popover-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Header */}
        <div className="tour-popover-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="tour-step-icon-wrap">
              <StepIcon size={16} />
            </div>
            <span className="tour-tag-pill">{currentStep.tag}</span>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-ghost btn-sm"
            onClick={endTour}
            style={{ width: 28, height: 28 }}
            title={t('tour.skip')}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="tour-popover-body">
          <h3 className="tour-step-title">{currentStep.title}</h3>
          <p className="tour-step-desc">{currentStep.desc}</p>
        </div>

        {/* Stepper Dots & Navigation Footer */}
        <div className="tour-popover-footer">
          <div className="tour-dots-row">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`tour-dot ${i === tourStep ? 'active' : ''}`}
                onClick={() => setTourStep(i)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tourStep > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={prevTourStep}
                style={{ padding: '4px 10px' }}
              >
                <ChevronLeft size={14} />
                <span>{t('tour.back')}</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm btn-lime"
              onClick={isLast ? endTour : nextTourStep}
              style={{ padding: '4px 14px' }}
            >
              <span>{isLast ? t('tour.finish') : t('tour.next')}</span>
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
