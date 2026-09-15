export const AVATAR_OPTIONS = [
  { id: 'fox', emoji: '🦊', labelEn: 'Smart Fox', labelBn: 'চালাক শিয়াল', bg: 'linear-gradient(135deg, #FF6B4A 0%, #FFA07A 100%)' },
  { id: 'lion', emoji: '🦁', labelEn: 'Bold Lion', labelBn: 'সাহসী সিংহ', bg: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
  { id: 'panda', emoji: '🐼', labelEn: 'Zen Panda', labelBn: 'শান্ত পান্ডা', bg: 'linear-gradient(135deg, #374151 0%, #6B7280 100%)' },
  { id: 'tiger', emoji: '🐯', labelEn: 'Fierce Tiger', labelBn: 'দুরন্ত বাঘ', bg: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)' },
  { id: 'owl', emoji: '🦉', labelEn: 'Wise Owl', labelBn: 'বিজ্ঞ পেঁচা', bg: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' },
  { id: 'eagle', emoji: '🦅', labelEn: 'Vision Eagle', labelBn: 'তীক্ষ্ণ ঈগল', bg: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' },
  { id: 'rocket', emoji: '🚀', labelEn: 'Growth Rocket', labelBn: 'গ্রোথ রকেট', bg: 'linear-gradient(135deg, #5ED21C 0%, #10B981 100%)' },
  { id: 'lightning', emoji: '⚡', labelEn: 'Fast Action', labelBn: 'তড়িৎ গতি', bg: 'linear-gradient(135deg, #EAB308 0%, #FDE047 100%)' },
  { id: 'diamond', emoji: '💎', labelEn: 'Wealth Gem', labelBn: 'মূল্যবান হীরা', bg: 'linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)' },
  { id: 'crown', emoji: '👑', labelEn: 'Finance King', labelBn: 'ফাইন্যান্স কিং', bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' },
  { id: 'sprout', emoji: '🌱', labelEn: 'Eco Saver', labelBn: 'ইকো সেভার', bg: 'linear-gradient(135deg, #15803D 0%, #4ADE80 100%)' },
  { id: 'target', emoji: '🎯', labelEn: 'Goal Crusher', labelBn: 'গোল ট্র্যাকার', bg: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)' },
];

export function getAvatarConfig(avatarId) {
  if (!avatarId) return null;
  return AVATAR_OPTIONS.find((a) => a.id === avatarId || a.emoji === avatarId) || null;
}
