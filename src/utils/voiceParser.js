/**
 * Bilingual Natural Language Financial Voice Parser
 * Supports English & Bengali (বাংলা) speech transcripts
 */

const BN_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const BN_NUM_WORDS = {
  'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5,
  'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
  'এগারো': 11, 'বারো': 12, 'তেরো': 13, 'চৌদ্দ': 14, 'পনেরো': 15,
  'ষোল': 16, 'সতেরো': 17, 'আঠারো': 18, 'উনিশ': 19, 'বিশ': 20,
  'কুড়ি': 20, 'পঁচিশ': 25, 'ত্রিশ': 30, 'পঁয়ত্রিশ': 35, 'চল্লিশ': 40,
  'পয়তাল্লিশ': 45, 'পঞ্চাশ': 50, 'ষাট': 60, 'সত্তর': 70, 'আশি': 80,
  'নব্বই': 90, 'একশত': 100, 'একশো': 100, 'দুইশত': 200, 'দুইশো': 200,
  'তিনশত': 300, 'তিনশো': 300, 'চারশত': 400, 'চারশো': 400, 'পাঁচশত': 500,
  'পাঁচশো': 500, 'ছয়শত': 600, 'ছয়শো': 600, 'সাতশত': 700, 'সাতশো': 700,
  'আটশত': 800, 'আটশো': 800, 'নয়শত': 900, 'নয়শো': 900,
};

const EN_NUM_WORDS = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
  'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
};

const CATEGORY_KEYWORDS = {
  food: [
    'food', 'lunch', 'dinner', 'breakfast', 'meal', 'coffee', 'snack', 'restaurant',
    'burger', 'biryani', 'pizza', 'grocery', 'groceries', 'bazar', 'bazaar',
    'খাবার', 'খাবারের', 'লাঞ্চ', 'ডিনার', 'নাস্তা', 'চা', 'কফি', 'রেস্টুরেন্ট', 'বিরিয়ানি',
    'বার্গার', 'বাজার', 'মুদি', 'মুদির'
  ],
  transport: [
    'transport', 'uber', 'pathao', 'rickshaw', 'cng', 'bus', 'train', 'fare',
    'fuel', 'petrol', 'gas', 'ticket', 'flight', 'commute',
    'যাতায়াত', 'রিকশা', 'রিকশায়', 'ভাড়া', 'বাস', 'ট্রেন', 'উবার', 'পাঠাও', 'সিএনজি',
    'তেল', 'পেট্রোল', 'টিকেট', 'গাড়ি'
  ],
  rent: [
    'rent', 'house rent', 'flat rent', 'office rent', 'room rent',
    'ভাড়া', 'বাড়ি ভাড়া', 'বাসা ভাড়া', 'রুম ভাড়া', 'ঘর ভাড়া'
  ],
  utilities: [
    'utility', 'utilities', 'electricity', 'current bill', 'power', 'water', 'gas',
    'internet', 'wifi', 'broadband', 'desco', 'dpdc', 'titas', 'wasa',
    'বিদ্যুৎ', 'কারেন্ট', 'কারেন্ট বিল', 'গ্যাস বিল', 'পানি', 'ইন্টারনেট', 'ওয়াইফাই', 'বিল'
  ],
  shopping: [
    'shopping', 'clothes', 'dress', 'shirt', 'pants', 'shoes', 'electronics',
    'gadget', 'daraz', 'amazon', 'purchase',
    'শপিং', 'কেনাকাটা', 'জামা', 'কাপড়', 'পোশাক', 'জুতা', 'ঘড়ি'
  ],
  health: [
    'health', 'medicine', 'doctor', 'hospital', 'medical', 'prescription', 'clinic', 'dentist',
    'চিকিৎসা', 'ওষুধ', 'ঔষধ', 'ডাক্তার', 'হাসপাতাল', 'প্রেসক্রিপশন', 'টেস্ট'
  ],
  education: [
    'education', 'tuition', 'fee', 'school', 'college', 'university', 'course', 'book', 'books',
    'পড়ালেখা', 'টিউশন', 'টিউশনি', 'ফি', 'স্কুল', 'কলেজ', 'বিশ্ববিদ্যালয়', 'বই'
  ],
  entertainment: [
    'entertainment', 'movie', 'cinema', 'game', 'netflix', 'spotify', 'outing', 'fun',
    'সিনেমা', 'মুভি', 'নাটক', 'ঘোরাঘুরি', 'বিনোদন'
  ],
  subscriptions: [
    'subscription', 'netflix', 'spotify', 'youtube', 'membership',
    'সাবস্ক্রিপশন', 'মেম্বারশিপ'
  ],
  salary: [
    'salary', 'paycheck', 'wage', 'stipend',
    'বেতন', 'মাসোহারা', 'ভাতা', 'মাইনে'
  ],
  freelance: [
    'freelance', 'client', 'upwork', 'fiverr', 'contract', 'project payment',
    'ফ্রিল্যান্সিং', 'ক্লায়েন্ট', 'প্রজেক্ট'
  ],
  business: [
    'business', 'sales', 'revenue', 'profit', 'shop sale', 'client payment',
    'ব্যবসা', 'বিক্রি', 'লাভ', 'মুনাফা'
  ],
  investment: [
    'investment', 'dividend', 'interest', 'share', 'crypto', 'profit share',
    'বিনিয়োগ', 'লভ্যাংশ', 'মুনাফা', 'সুদ'
  ],
  gift: [
    'gift', 'present', 'reward', 'prize', 'cashback',
    'উপহার', 'বখশিশ', 'পুরস্কার', 'ক্যাশব্যাক'
  ],
};

const ACCOUNT_KEYWORDS = {
  bkash: ['bkash', 'b-kash', 'বিকাশ', 'বিকাশে'],
  nagad: ['nagad', 'নগদ', 'নগদে'],
  rocket: ['rocket', 'রকেট', 'রকেটে'],
  bank: ['bank', 'brac', 'city', 'dbbl', 'ebl', 'scb', 'ব্যাংক', 'ব্যাংকে', 'ডাচ বাংলা'],
  wallet: ['cash', 'wallet', 'hand cash', 'pocket', 'ক্যাশ', 'মানিব্যাগ', 'নগদ টাকা', 'হাতে']
};

/**
 * Normalizes numbers from transcript into an integer
 */
function extractAmount(text) {
  // 1. Replace Bengali digits with Arabic digits
  let normalized = text.split('').map((ch) => BN_DIGITS[ch] || ch).join('');

  // 2. Look for patterns like "5k", "5.5k", "10k"
  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:k|কে)\b/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  // 3. Look for patterns like "5 thousand", "৫ হাজার", "10 lakh", "১০ লাখ"
  const multiplierMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(হাজার|লাখ|কোটি|thousand|lakh|crore|শত|শো|hundred)/i);
  if (multiplierMatch) {
    const base = parseFloat(multiplierMatch[1]);
    const word = multiplierMatch[2].toLowerCase();
    if (word === 'হাজার' || word === 'thousand') return Math.round(base * 1000);
    if (word === 'লাখ' || word === 'lakh') return Math.round(base * 100000);
    if (word === 'কোটি' || word === 'crore') return Math.round(base * 10000000);
    if (word === 'শত' || word === 'শো' || word === 'hundred') return Math.round(base * 100);
  }

  // 4. Look for raw numbers with optional currency symbols: ৳500, 500 taka, 500 টাকা, 1,500
  const numMatches = normalized.match(/(?:৳|\$|tk|টাকা)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)\s*(?:টাকা|tk|bdt|taka)?/gi);
  if (numMatches) {
    for (const match of numMatches) {
      const cleanNum = match.replace(/[^0-9.]/g, '');
      const val = parseFloat(cleanNum);
      if (!isNaN(val) && val > 0) {
        return Math.round(val);
      }
    }
  }

  // 5. Bengali & English number words ("পাঁচশত", "পাঁচশো", "five hundred")
  for (const [word, val] of Object.entries(BN_NUM_WORDS)) {
    if (text.includes(word)) {
      if (text.includes(`${word} হাজার`) || text.includes(`${word}হাজার`)) {
        return val * 1000;
      }
      return val;
    }
  }

  for (const [word, val] of Object.entries(EN_NUM_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) {
      return val;
    }
  }

  return null;
}

/**
 * Detects whether the transaction is an expense, income, or balance adjust
 */
function extractType(text) {
  const lower = text.toLowerCase();

  // Adjust balance
  if (
    lower.includes('adjust') ||
    lower.includes('balance') ||
    lower.includes('ব্যালেন্স') ||
    lower.includes('সমন্বয়') ||
    lower.includes('টাকা আছে')
  ) {
    if (!lower.includes('expense') && !lower.includes('খরচ') && !lower.includes('income') && !lower.includes('আয়')) {
      return 'adjust';
    }
  }

  // Income
  const incomeKeywords = [
    'income', 'earn', 'earned', 'salary', 'received', 'got', 'deposit', 'credited',
    'bonus', 'profit', 'reimbursement', 'gift',
    'আয়', 'বেতন', 'পেলাম', 'জমা', 'আসলো', 'লাভ', 'উপহার'
  ];
  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) {
      return 'income';
    }
  }

  // Expense (Default if amount is mentioned without income keywords)
  return 'expense';
}

/**
 * Matches category based on spoken keywords
 */
function extractCategory(text, type, availableCategories) {
  const lower = text.toLowerCase();

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const exists = (availableCategories[type] || []).find((c) => c.id === catId);
        if (exists) {
          return { id: exists.id, key: exists.key, color: exists.color };
        }
        return { id: catId, key: catId, color: '#34D399' };
      }
    }
  }

  // Fallback defaults
  if (type === 'income') {
    return { id: 'salary', key: 'salary', color: '#4ADE80' };
  }
  return { id: 'food', key: 'food', color: '#FB923C' };
}

/**
 * Matches source account if spoken
 */
function extractAccount(text, accounts) {
  const lower = text.toLowerCase();

  for (const [accType, keywords] of Object.entries(ACCOUNT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const matched = accounts.find((a) => {
          const name = a.name.toLowerCase();
          return name.includes(kw) || a.type === accType;
        });
        if (matched) return matched;
      }
    }
  }

  return accounts.length > 0 ? accounts[0] : null;
}

/**
 * Main parse function
 */
export function parseVoiceInput(transcript, { categories, accounts }) {
  if (!transcript || typeof transcript !== 'string') {
    return null;
  }

  const cleanText = transcript.trim();
  const amount = extractAmount(cleanText);

  if (!amount || amount <= 0) {
    return {
      success: false,
      rawText: cleanText,
      error: 'Could not detect a valid amount. Please speak an amount like "500 taka".',
    };
  }

  const type = extractType(cleanText);
  const category = extractCategory(cleanText, type, categories);
  const account = extractAccount(cleanText, accounts);

  let note = cleanText;

  return {
    success: true,
    rawText: cleanText,
    type,
    amount,
    categoryId: category.id,
    categoryKey: category.key,
    categoryColor: category.color,
    accountId: account ? account.id : '',
    accountName: account ? account.name : '',
    accountType: account ? account.type : '',
    note,
  };
}
