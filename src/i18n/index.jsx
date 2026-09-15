import { createContext, useContext, useState, useCallback } from 'react';
import en from './en.json';
import bn from './bn.json';

const translations = { en, bn };

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('hisab-lang') || 'en';
  });

  const changeLanguage = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('hisab-lang', newLang);
    document.documentElement.setAttribute('data-lang', newLang);
  }, []);

  // Nested key accessor: t('dashboard.title') => 'Dashboard'
  const t = useCallback((key, fallback) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        let enValue = translations.en;
        for (const ek of keys) {
          if (enValue && typeof enValue === 'object' && ek in enValue) {
            enValue = enValue[ek];
          } else {
            return fallback || key;
          }
        }
        return enValue;
      }
    }
    return value || fallback || key;
  }, [lang]);

  // Format currency in BDT
  const formatCurrency = useCallback((amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '৳0';

    if (lang === 'bn') {
      const formatted = formatBanglaNumber(Math.abs(num));
      return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
    }

    const formatted = formatIndianNumber(Math.abs(num));
    return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
  }, [lang]);

  // Format date
  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr);
    if (lang === 'bn') {
      const day = toBanglaDigits(date.getDate());
      const month = bnMonths[date.getMonth()];
      const year = toBanglaDigits(date.getFullYear());
      return `${day} ${month} ${year}`;
    }
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [lang]);

  return (
    <I18nContext.Provider value={{ t, lang, changeLanguage, formatCurrency, formatDate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

// ---- Helpers ----

const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBanglaDigits(num) {
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d)]);
}

function formatIndianNumber(num) {
  const str = num.toFixed(num % 1 === 0 ? 0 : 2);
  const [intPart, decPart] = str.split('.');
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const formatted = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return decPart ? `${formatted}.${decPart}` : formatted;
}

function formatBanglaNumber(num) {
  return toBanglaDigits(formatIndianNumber(num));
}
