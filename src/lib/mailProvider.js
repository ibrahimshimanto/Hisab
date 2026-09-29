/**
 * Utility to identify popular email providers and generate direct deep-links
 * to the user's inbox, optimizing the 1-click magic link onboarding experience.
 */
export const getMailProvider = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null;
  }

  const parts = email.split('@');
  const domain = parts[1]?.toLowerCase().trim();
  if (!domain) return null;

  // Google / Gmail
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return {
      id: 'gmail',
      name: 'Gmail',
      url: 'https://mail.google.com/mail/u/0/#inbox',
      isWebmail: true,
    };
  }

  // Microsoft Outlook / Hotmail / Live
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) {
    return {
      id: 'outlook',
      name: 'Outlook',
      url: 'https://outlook.live.com/mail/0/inbox',
      isWebmail: true,
    };
  }

  // Yahoo Mail
  if (['yahoo.com', 'ymail.com', 'myyahoo.com'].includes(domain)) {
    return {
      id: 'yahoo',
      name: 'Yahoo Mail',
      url: 'https://mail.yahoo.com',
      isWebmail: true,
    };
  }

  // Apple iCloud
  if (['icloud.com', 'me.com', 'mac.com'].includes(domain)) {
    return {
      id: 'icloud',
      name: 'iCloud Mail',
      url: 'https://www.icloud.com/mail/',
      isWebmail: true,
    };
  }

  // Proton Mail
  if (['proton.me', 'protonmail.com'].includes(domain)) {
    return {
      id: 'proton',
      name: 'Proton Mail',
      url: 'https://mail.proton.me',
      isWebmail: true,
    };
  }

  // Zoho Mail
  if (domain === 'zoho.com') {
    return {
      id: 'zoho',
      name: 'Zoho Mail',
      url: 'https://mail.zoho.com',
      isWebmail: true,
    };
  }

  // Default fallback for custom / corporate domains: open system email client
  return {
    id: 'default',
    name: 'Mail App',
    url: 'mailto:',
    isWebmail: false,
  };
};
