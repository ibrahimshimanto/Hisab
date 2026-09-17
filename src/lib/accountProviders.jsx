import React from 'react';

// =========================================================
// Authentic MFS Providers in Bangladesh
// =========================================================
export const MFS_PROVIDERS = [
  {
    id: 'bkash',
    name: 'bKash',
    nameBn: 'বিকাশ',
    color: '#E2136E',
    bg: 'rgba(226, 19, 110, 0.12)',
    logoType: 'bkash',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    nameBn: 'নগদ',
    color: '#F7941D',
    bg: 'rgba(247, 148, 29, 0.12)',
    logoType: 'nagad',
  },
  {
    id: 'rocket',
    name: 'Rocket (DBBL)',
    nameBn: 'রকেট (ডাচ্-বাংলা)',
    color: '#8B21BB',
    bg: 'rgba(139, 33, 187, 0.12)',
    logoType: 'rocket',
  },
  {
    id: 'upay',
    name: 'Upay (UCB)',
    nameBn: 'উপায় (ইউসিবি)',
    color: '#005C9E',
    bg: 'rgba(0, 92, 158, 0.12)',
    logoType: 'upay',
  },
  {
    id: 'cellfin',
    name: 'Cellfin (IBBL)',
    nameBn: 'সেলফিন (ইসলামী ব্যাংক)',
    color: '#00875A',
    bg: 'rgba(0, 135, 90, 0.12)',
    logoType: 'cellfin',
  },
  {
    id: 'other_mfs',
    name: 'Other MFS',
    nameBn: 'অন্যান্য মোবাইল ব্যাংকিং',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.12)',
    logoType: 'other_mfs',
  },
];

// =========================================================
// Major Banks in Bangladesh
// =========================================================
export const BANK_PROVIDERS = [
  {
    id: 'brac',
    name: 'BRAC Bank',
    nameBn: 'ব্র্যাক ব্যাংক',
    color: '#005A9C',
    bg: 'rgba(0, 90, 156, 0.12)',
    shortName: 'BRAC',
  },
  {
    id: 'city',
    name: 'City Bank',
    nameBn: 'দি সিটি ব্যাংক',
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.12)',
    shortName: 'City',
  },
  {
    id: 'ibbl',
    name: 'Islami Bank Bangladesh (IBBL)',
    nameBn: 'ইসলামী ব্যাংক বাংলাদেশ',
    color: '#0D9488',
    bg: 'rgba(13, 148, 136, 0.12)',
    shortName: 'IBBL',
  },
  {
    id: 'dbbl',
    name: 'Dutch-Bangla Bank (DBBL)',
    nameBn: 'ডাচ্-বাংলা ব্যাংক',
    color: '#E11D48',
    bg: 'rgba(225, 29, 72, 0.12)',
    shortName: 'DBBL',
  },
  {
    id: 'ebl',
    name: 'Eastern Bank (EBL)',
    nameBn: 'ইস্টার্ন ব্যাংক',
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.12)',
    shortName: 'EBL',
  },
  {
    id: 'scb',
    name: 'Standard Chartered',
    nameBn: 'স্ট্যান্ডার্ড চার্টার্ড',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    shortName: 'SCB',
  },
  {
    id: 'sonali',
    name: 'Sonali Bank',
    nameBn: 'সোনালী ব্যাংক',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    shortName: 'Sonali',
  },
  {
    id: 'bank_asia',
    name: 'Bank Asia',
    nameBn: 'ব্যাংক এশিয়া',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.12)',
    shortName: 'Bank Asia',
  },
  {
    id: 'mtb',
    name: 'Mutual Trust Bank (MTB)',
    nameBn: 'মিউচুয়াল ট্রাস্ট ব্যাংক',
    color: '#EA580C',
    bg: 'rgba(234, 88, 12, 0.12)',
    shortName: 'MTB',
  },
  {
    id: 'prime',
    name: 'Prime Bank',
    nameBn: 'প্রাইম ব্যাংক',
    color: '#0284C7',
    bg: 'rgba(2, 132, 199, 0.12)',
    shortName: 'Prime',
  },
  {
    id: 'ucb',
    name: 'United Commercial Bank (UCB)',
    nameBn: 'ইউসিবি ব্যাংক',
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.12)',
    shortName: 'UCB',
  },
  {
    id: 'dhaka_bank',
    name: 'Dhaka Bank',
    nameBn: 'ঢাকা ব্যাংক',
    color: '#0891B2',
    bg: 'rgba(8, 145, 178, 0.12)',
    shortName: 'Dhaka',
  },
  {
    id: 'pubali',
    name: 'Pubali Bank',
    nameBn: 'পূবালী ব্যাংক',
    color: '#16A34A',
    bg: 'rgba(22, 163, 74, 0.12)',
    shortName: 'Pubali',
  },
  {
    id: 'trust',
    name: 'Trust Bank',
    nameBn: 'ট্রাস্ট ব্যাংক',
    color: '#4338CA',
    bg: 'rgba(67, 56, 202, 0.12)',
    shortName: 'Trust',
  },
  {
    id: 'other_bank',
    name: 'Other Bank',
    nameBn: 'অন্যান্য ব্যাংক',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)',
    shortName: 'Bank',
  },
];

// =========================================================
// Wallet Options
// =========================================================
export const WALLET_PROVIDERS = [
  {
    id: 'cash_wallet',
    name: 'Cash Wallet',
    nameBn: 'নগদ টাকা (ক্যাশ)',
    color: '#5ED21C',
    bg: 'rgba(94, 210, 28, 0.14)',
  },
  {
    id: 'petty_cash',
    name: 'Petty Cash',
    nameBn: 'দৈনন্দিন খুচরা খরচ',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.14)',
  },
  {
    id: 'safe_deposit',
    name: 'Emergency Locker / Safe',
    nameBn: 'জরুরি লকার / সেফ',
    color: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.14)',
  },
];

// =========================================================
// Official Vector Logo Assets Map
// =========================================================
const OFFICIAL_LOGOS = {
  bkash: { src: '/logos/bkash.svg', alt: 'bKash', bg: '#FFFFFF' },
  nagad: { src: '/logos/nagad.svg', alt: 'Nagad', bg: '#FFFFFF' },
  rocket: { src: '/logos/rocket.svg', alt: 'Rocket', bg: '#FFFFFF' },
  upay: { src: '/logos/upay.svg', alt: 'Upay', bg: '#FFFFFF' },
  cellfin: { src: '/logos/cellfin.png', alt: 'CellFin', bg: '#FFFFFF' },
  brac: { src: '/logos/brac.svg', alt: 'BRAC Bank', bg: '#FFFFFF' },
  city: { src: '/logos/city.svg', alt: 'City Bank', bg: '#FFFFFF' },
  dbbl: { src: '/logos/dbbl.svg', alt: 'DBBL', bg: '#FFFFFF' },
  ibbl: { src: '/logos/ibbl.svg', alt: 'Islami Bank', bg: '#FFFFFF' },
  ebl: { src: '/logos/ebl.svg', alt: 'EBL', bg: '#FFFFFF' },
  scb: { src: '/logos/scb.svg', alt: 'Standard Chartered', bg: '#FFFFFF' },
  sonali: { src: '/logos/sonali.svg', alt: 'Sonali Bank', bg: '#FFFFFF' },
};

// =========================================================
// Authentic Official Logo Renderer Component
// =========================================================
export function ProviderLogo({ providerId, name = '', type = 'mfs', size = 20, style = {} }) {
  const normName = (name || '').toLowerCase();
  const r = Math.max(4, Math.round(size * 0.22));

  // Match provider ID or text name
  let matchedKey = null;
  if (providerId === 'bkash' || normName.includes('bkash') || normName.includes('বিকাশ')) matchedKey = 'bkash';
  else if (providerId === 'nagad' || normName.includes('nagad') || normName.includes('নগদ')) matchedKey = 'nagad';
  else if (providerId === 'rocket' || normName.includes('rocket') || normName.includes('রকেট')) matchedKey = 'rocket';
  else if (providerId === 'upay' || normName.includes('upay') || normName.includes('উপায়')) matchedKey = 'upay';
  else if (providerId === 'cellfin' || normName.includes('cellfin') || normName.includes('সেলফিন')) matchedKey = 'cellfin';
  else if (providerId === 'brac' || normName.includes('brac') || normName.includes('ব্র্যাক')) matchedKey = 'brac';
  else if (providerId === 'city' || normName.includes('city bank') || normName.includes('সিটি')) matchedKey = 'city';
  else if (providerId === 'dbbl' || normName.includes('dutch-bangla') || normName.includes('dbbl') || normName.includes('ডাচ্-বাংলা')) matchedKey = 'dbbl';
  else if (providerId === 'ibbl' || normName.includes('islami bank') || normName.includes('ibbl') || normName.includes('ইসলামী')) matchedKey = 'ibbl';
  else if (providerId === 'ebl' || normName.includes('eastern bank') || normName.includes('ebl') || normName.includes('ইস্টার্ন')) matchedKey = 'ebl';
  else if (providerId === 'scb' || normName.includes('standard chartered') || normName.includes('scb')) matchedKey = 'scb';
  else if (providerId === 'sonali' || normName.includes('sonali') || normName.includes('সোনালী')) matchedKey = 'sonali';

  if (matchedKey && OFFICIAL_LOGOS[matchedKey]) {
    const logo = OFFICIAL_LOGOS[matchedKey];
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: r,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: logo.bg,
          border: '1px solid rgba(17, 20, 17, 0.08)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          padding: Math.max(2, Math.round(size * 0.08)),
          overflow: 'hidden',
          flexShrink: 0,
          boxSizing: 'border-box',
          verticalAlign: 'middle',
          ...style,
        }}
      >
        <img
          src={logo.src}
          alt={logo.alt}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Default Bank Icon
  if (type === 'bank') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
        <rect width="40" height="40" rx="10" fill="#3B82F6" />
        <path d="M10 17L20 11L30 17H10Z" fill="#FFFFFF" />
        <rect x="13" y="18" width="3" height="8" fill="#FFFFFF" />
        <rect x="18.5" y="18" width="3" height="8" fill="#FFFFFF" />
        <rect x="24" y="18" width="3" height="8" fill="#FFFFFF" />
        <rect x="10" y="27" width="20" height="2.5" rx="1" fill="#FFFFFF" />
      </svg>
    );
  }

  // Default Wallet / Cash Icon
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
      <rect width="40" height="40" rx="10" fill="#5ED21C" />
      <rect x="9" y="12" width="22" height="16" rx="3" fill="#111411" />
      <rect x="22" y="17" width="9" height="6" rx="3" fill="#FFFFFF" />
      <circle cx="26" cy="20" r="1.2" fill="#111411" />
    </svg>
  );
}

export function findProvider(nameOrId = '', type = 'mfs') {
  const norm = String(nameOrId || '').toLowerCase().trim();
  const list = type === 'mfs' ? MFS_PROVIDERS : type === 'bank' ? BANK_PROVIDERS : WALLET_PROVIDERS;
  return list.find((p) => p.id === norm || p.name.toLowerCase() === norm || norm.includes(p.id) || norm.includes(p.name.toLowerCase())) || list[0];
}

