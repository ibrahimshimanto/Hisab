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
// Authentic SVG Logo Renderer Component
// =========================================================
export function ProviderLogo({ providerId, name = '', type = 'mfs', size = 20, style = {} }) {
  const normName = (name || '').toLowerCase();

  // 1. bKash Brand Bird Logo
  if (providerId === 'bkash' || normName.includes('bkash') || normName.includes('বিকাশ')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#E2136E" />
        <path
          d="M6 18.5L16 8L13 23.5L16.5 19L20.5 24L26 9L17.5 15.5L16 12L6 18.5Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 2. Nagad Brand Ribbon / Flame Logo
  if (providerId === 'nagad' || normName.includes('nagad') || normName.includes('নগদ')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#F7941D" />
        <path
          d="M8 21.5C8.5 16 12.5 11 17.5 9.5C15.5 12 15 14.5 16 16.5C17.5 13.5 21 11.5 24 10.5C23.5 14.5 21 18 17 20.5C14.5 22 11 22.5 8 21.5Z"
          fill="#FFFFFF"
        />
        <circle cx="13" cy="18" r="2.5" fill="#ED1C24" />
      </svg>
    );
  }

  // 3. Rocket (DBBL) Logo
  if (providerId === 'rocket' || normName.includes('rocket') || normName.includes('রকেট')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#8B21BB" />
        <path
          d="M16 6C16 6 12 11 12 17C12 20 13.5 22 16 26C18.5 22 20 20 20 17C20 11 16 6 16 6Z"
          fill="#FFFFFF"
        />
        <circle cx="16" cy="15" r="2" fill="#F7941D" />
        <path d="M10 18L12 20L11 23L9 21L10 18Z" fill="#FFFFFF" opacity="0.8" />
        <path d="M22 18L20 20L21 23L23 21L22 18Z" fill="#FFFFFF" opacity="0.8" />
      </svg>
    );
  }

  // 4. Upay Logo
  if (providerId === 'upay' || normName.includes('upay') || normName.includes('উপায়')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#005C9E" />
        <path
          d="M9 11V18C9 21.5 11.5 24 15 24H17C20.5 24 23 21.5 23 18V11H19V18C19 19.5 18 20.5 16.5 20.5H15.5C14 20.5 13 19.5 13 18V11H9Z"
          fill="#FFDE00"
        />
      </svg>
    );
  }

  // 5. Cellfin Logo
  if (providerId === 'cellfin' || normName.includes('cellfin') || normName.includes('সেলফিন')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#00875A" />
        <path d="M16 8L24 14V22L16 26L8 22V14L16 8Z" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
        <circle cx="16" cy="17" r="3" fill="#FFFFFF" />
      </svg>
    );
  }

  // 6. City Bank
  if (providerId === 'city' || normName.includes('city bank') || normName.includes('সিটি')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#DC2626" />
        <path d="M7 16L16 8L25 16H22V24H10V16H7Z" fill="#FFFFFF" />
        <rect x="14" y="17" width="4" height="7" fill="#DC2626" />
      </svg>
    );
  }

  // 7. BRAC Bank
  if (providerId === 'brac' || normName.includes('brac') || normName.includes('ব্র্যাক')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#005A9C" />
        <circle cx="16" cy="16" r="8" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <path d="M11 16H21M16 11V21" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // 8. DBBL (Dutch-Bangla Bank)
  if (providerId === 'dbbl' || normName.includes('dutch-bangla') || normName.includes('dbbl') || normName.includes('ডাচ্-বাংলা')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#E11D48" />
        <circle cx="16" cy="16" r="9" fill="#FFFFFF" />
        <path d="M12 16C12 13.8 13.8 12 16 12C18.2 12 20 13.8 20 16C20 18.2 18.2 20 16 20C13.8 20 12 18.2 12 16Z" fill="#E11D48" />
      </svg>
    );
  }

  // 9. IBBL (Islami Bank)
  if (providerId === 'ibbl' || normName.includes('islami bank') || normName.includes('ibbl') || normName.includes('ইসলামী')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#0D9488" />
        <path d="M16 7L24 13V22L16 26L8 22V13L16 7Z" fill="#FFFFFF" />
        <path d="M16 11L21 15V20L16 23L11 20V15L16 11Z" fill="#0D9488" />
      </svg>
    );
  }

  // 10. EBL (Eastern Bank)
  if (providerId === 'ebl' || normName.includes('eastern bank') || normName.includes('ebl') || normName.includes('ইস্টার্ন')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#2563EB" />
        <path d="M10 10H22V14H14V16H20V20H14V22H22V24H10V10Z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 11. Standard Chartered
  if (providerId === 'scb' || normName.includes('standard chartered') || normName.includes('scb')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#059669" />
        <path d="M9 18C9 13.5 12.5 10 17 10C21.5 10 23 13 23 13L20 15C20 15 19 13 17 13C14.5 13 12.5 15 12.5 18C12.5 21 14.5 23 17 23C19 23 20 21 20 21L23 23C23 23 21.5 26 17 26C12.5 26 9 22.5 9 18Z" fill="#FFFFFF" />
        <circle cx="21" cy="12" r="2.5" fill="#38BDF8" />
      </svg>
    );
  }

  // 12. Sonali Bank
  if (providerId === 'sonali' || normName.includes('sonali') || normName.includes('সোনালী')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#D97706" />
        <circle cx="16" cy="16" r="8" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="5" fill="#D97706" />
      </svg>
    );
  }

  // Default Bank
  if (type === 'bank') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
        <rect width="32" height="32" rx="8" fill="#3B82F6" />
        <path d="M8 14L16 9L24 14H8Z" fill="#FFFFFF" />
        <rect x="10" y="15" width="2" height="7" fill="#FFFFFF" />
        <rect x="15" y="15" width="2" height="7" fill="#FFFFFF" />
        <rect x="20" y="15" width="2" height="7" fill="#FFFFFF" />
        <rect x="8" y="22" width="16" height="2" fill="#FFFFFF" />
      </svg>
    );
  }

  // Default Wallet / Cash
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style}>
      <rect width="32" height="32" rx="8" fill="#5ED21C" />
      <path d="M7 11C7 9.89543 7.89543 9 9 9H23C24.1046 9 25 9.89543 25 11V21C25 22.1046 24.1046 23 23 23H9C7.89543 23 7 22.1046 7 21V11Z" fill="#111411" />
      <rect x="18" y="14" width="7" height="5" rx="2.5" fill="#FFFFFF" />
      <circle cx="21" cy="16.5" r="1" fill="#111411" />
    </svg>
  );
}

export function findProvider(nameOrId = '', type = 'mfs') {
  const norm = String(nameOrId || '').toLowerCase().trim();
  const list = type === 'mfs' ? MFS_PROVIDERS : type === 'bank' ? BANK_PROVIDERS : WALLET_PROVIDERS;
  return list.find((p) => p.id === norm || p.name.toLowerCase() === norm || norm.includes(p.id) || norm.includes(p.name.toLowerCase())) || list[0];
}

