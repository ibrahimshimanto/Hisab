/**
 * Hisab (হিসাব) — AI Financial Intelligence Engine
 * Computes multi-dimensional analytics: Health Score (0-100), Liquidity Runway,
 * Spending Spikes, Driving Mode Compliance, and Answers to Interactive Prompts.
 */

export function analyzeFinancialHealth({
  accounts = [],
  transactions = [],
  budgets = [],
  savingsGoals = [],
  financialMode = 'cruise',
  modeSettings = {},
  monthlySalary = 0,
  lang = 'en',
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Core balances & liquid reserves
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const liquidAccounts = accounts.filter((a) => a.type === 'mfs' || a.type === 'wallet');
  const liquidBalance = liquidAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const lockedInSavings = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalNetWorth = totalBalance + lockedInSavings;

  // 2. Current Month Inflow & Outflow
  const currentMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const currentMonthIncome = currentMonthTxns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const currentMonthExpense = currentMonthTxns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const effectiveIncome = currentMonthIncome > 0 ? currentMonthIncome : (monthlySalary > 0 ? monthlySalary : totalBalance);
  const netCashFlow = currentMonthIncome - currentMonthExpense;
  const savingsRate = effectiveIncome > 0 ? Math.max(0, Math.round(((effectiveIncome - currentMonthExpense) / effectiveIncome) * 100)) : 0;

  // 3. Average Daily Burn Rate (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last30DaysExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return t.type === 'expense' && d >= thirtyDaysAgo;
  });
  const total30DayExpense = last30DaysExpenses.reduce((s, t) => s + (t.amount || 0), 0);
  const avgDailyBurn = total30DayExpense > 0 ? Math.round(total30DayExpense / 30) : (currentMonthExpense > 0 ? Math.round(currentMonthExpense / Math.max(1, now.getDate())) : 250);

  // 4. Liquidity Runway (Months)
  const monthlyBurn = Math.max(1000, avgDailyBurn * 30);
  const runwayMonths = totalBalance > 0 ? (totalBalance / monthlyBurn).toFixed(1) : '0.0';

  // 5. Target Driving Mode Compliance
  const targetSavingRate = modeSettings[financialMode]?.savingRate ?? (financialMode === 'eco' ? 40 : financialMode === 'racing' ? 5 : 20);
  const modeCompliant = savingsRate >= targetSavingRate;
  const modeGapRate = Math.abs(savingsRate - targetSavingRate);

  // 6. Category Spending Spikes (vs previous 30 days)
  const previous30to60Days = transactions.filter((t) => {
    const d = new Date(t.date);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    return t.type === 'expense' && d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  const currentCategoryTotals = {};
  last30DaysExpenses.forEach((t) => {
    currentCategoryTotals[t.categoryId] = (currentCategoryTotals[t.categoryId] || 0) + t.amount;
  });

  const previousCategoryTotals = {};
  previous30to60Days.forEach((t) => {
    previousCategoryTotals[t.categoryId] = (previousCategoryTotals[t.categoryId] || 0) + t.amount;
  });

  const categorySpikes = [];
  Object.entries(currentCategoryTotals).forEach(([catId, currentAmt]) => {
    const prevAmt = previousCategoryTotals[catId] || 0;
    if (prevAmt > 500 && currentAmt > prevAmt * 1.25) {
      const pctIncrease = Math.round(((currentAmt - prevAmt) / prevAmt) * 100);
      categorySpikes.push({
        categoryId: catId,
        currentAmt,
        prevAmt,
        pctIncrease,
      });
    }
  });

  // 7. Composite Financial Health Score (0 - 100)
  let score = 0;
  score += Math.min(40, Math.round((savingsRate / 40) * 40));
  score += Math.min(30, Math.round((parseFloat(runwayMonths) / 6) * 30));
  score += modeCompliant ? 15 : Math.max(0, 15 - modeGapRate);
  score += accounts.length >= 2 ? 10 : 5;
  score += savingsGoals.length > 0 ? 5 : 0;
  score = Math.min(100, Math.max(20, score));

  let scoreTier = 'healthy';
  let scoreLabel = lang === 'bn' ? 'সুদৃঢ় ও স্বাস্থ্যকর' : 'Financially Robust';
  let scoreColor = '#5ED21C';
  if (score < 50) {
    scoreTier = 'critical';
    scoreLabel = lang === 'bn' ? 'মনোযোগ প্রয়োজন' : 'Requires Attention';
    scoreColor = '#F43F5E';
  } else if (score < 75) {
    scoreTier = 'moderate';
    scoreLabel = lang === 'bn' ? 'সন্তোষজনক' : 'Moderate & Steady';
    scoreColor = '#FBBF24';
  }

  // 8. Dynamic Curated AI Insights Feed
  const insights = [];

  // Insight A: Runway & Reserve Alert/Praise
  if (parseFloat(runwayMonths) >= 6) {
    insights.push({
      id: 'runway-high',
      type: 'milestone',
      badge: lang === 'bn' ? 'নিরাপদ রিজার্ভ' : 'Fortified Runway',
      title: lang === 'bn' ? `আপনার তরল রিজার্ভ ${runwayMonths} মাস পর্যন্ত সুরক্ষা দেবে!` : `Exceptional Emergency Runway: ${runwayMonths} Months Protected!`,
      desc: lang === 'bn'
        ? 'আপনার বর্তমান ব্যয়ের গতি বিবেচনায় আপদকালীন সময়ের জন্য আপনার সঞ্চয় পর্যাপ্ত ও স্থিতিশীল।'
        : 'Your liquid balances can sustain your current lifestyle without new income for over half a year.',
      metric: `${runwayMonths} mo`,
      action: null,
    });
  } else if (parseFloat(runwayMonths) < 2) {
    insights.push({
      id: 'runway-low',
      type: 'alert',
      badge: lang === 'bn' ? 'সতর্কতা' : 'Liquidity Warning',
      title: lang === 'bn' ? 'জরুরি রিজার্ভ বৃদ্ধি করা প্রয়োজন' : 'Build Your Liquid Buffer',
      desc: lang === 'bn'
        ? `আপনার সঞ্চয় মাত্র ${runwayMonths} মাসের ব্যয় মেটাতে সক্ষম। অপ্রত্যাশিত খরচ মোকাবেলায় অন্তত ৩ মাসের তহবিল রাখুন।`
        : `Your liquid cash covers only ${runwayMonths} months of spending. Target at least 3 months to prevent liquidity strain.`,
      metric: `${runwayMonths} mo`,
      action: { type: 'navigate', route: '/savings', label: lang === 'bn' ? 'রিজার্ভ ফান্ড তৈরি করুন' : 'Setup Emergency Goal' },
    });
  }

  // Insight B: Mode Compliance
  if (modeCompliant) {
    insights.push({
      id: 'mode-on-track',
      type: 'opportunity',
      badge: lang === 'bn' ? 'মোড লক্ষ্যমাত্রা অর্জিত' : 'Mode Target Met',
      title: lang === 'bn'
        ? `${financialMode.toUpperCase()} মোডে আপনার সঞ্চয় লক্ষ্য পূরণ হয়েছে!`
        : `Cruising ahead in ${financialMode.toUpperCase()} Mode (${savingsRate}% vs ${targetSavingRate}% target)!`,
      desc: lang === 'bn'
        ? `চলতি মাসে আপনি লক্ষ্যের চেয়ে ${savingsRate - targetSavingRate}% বেশি সঞ্চয় করছেন। উদ্বৃত্ত টাকা উচ্চ-মুনাফার ডিপিএস বা এফডিআরে স্থানান্তর করতে পারেন।`
        : `You are outperforming your target savings rate by ${savingsRate - targetSavingRate}%. Consider locking the surplus in a high-yield DPS.`,
      metric: `${savingsRate}%`,
      action: { type: 'navigate', route: '/savings', label: lang === 'bn' ? 'ডিপিএস স্কিম দেখুন' : 'Explore DPS Schemes' },
    });
  } else {
    const requiredAdjustment = Math.round(effectiveIncome * ((targetSavingRate - savingsRate) / 100));
    insights.push({
      id: 'mode-off-track',
      type: 'alert',
      badge: lang === 'bn' ? 'লক্ষ্যমাত্রা সমন্বয়' : 'Pacing Adjustment',
      title: lang === 'bn'
        ? `${financialMode.toUpperCase()} মোডে ফিরতে ৳${requiredAdjustment.toLocaleString()} কম খরচ করুন`
        : `Rebalance spending by ৳${requiredAdjustment.toLocaleString()} to reach ${targetSavingRate}% target`,
      desc: lang === 'bn'
        ? `আপনার বর্তমান সঞ্চয় হার ${savingsRate}% যা নির্ধারিত লক্ষ্যমাত্রা ${targetSavingRate}% এর চেয়ে কিছুটা কম।`
        : `You are currently saving ${savingsRate}%. Trimming discretionary shopping will bring you back on schedule.`,
      metric: `-${targetSavingRate - savingsRate}%`,
      action: null,
    });
  }

  // Insight C: Category Spikes
  if (categorySpikes.length > 0) {
    const topSpike = categorySpikes.sort((a, b) => b.pctIncrease - a.pctIncrease)[0];
    insights.push({
      id: 'cat-spike',
      type: 'alert',
      badge: lang === 'bn' ? 'অস্বাভাবিক ব্যয় বৃদ্ধি' : 'Spending Spike Detected',
      title: lang === 'bn'
        ? `${topSpike.categoryId.toUpperCase()} খাতে ব্যয় ${topSpike.pctIncrease}% বৃদ্ধি পেয়েছে`
        : `Unusual Surge: ${topSpike.categoryId.toUpperCase()} spending jumped +${topSpike.pctIncrease}%!`,
      desc: lang === 'bn'
        ? `গত ৩০ দিনে এই খাতে মোট ৳${topSpike.currentAmt.toLocaleString()} খরচ হয়েছে (পূর্বে ৳${topSpike.prevAmt.toLocaleString()})।`
        : `You spent ৳${topSpike.currentAmt.toLocaleString()} in the last 30 days compared to ৳${topSpike.prevAmt.toLocaleString()} previously.`,
      metric: `+${topSpike.pctIncrease}%`,
      action: { type: 'navigate', route: '/budgets', label: lang === 'bn' ? 'বাজেট সীমা নির্ধারণ করুন' : 'Set Category Budget' },
    });
  }

  // 9. Interactive Pre-computed Prompt Responses
  const queryAnswers = {
    whereDidMoneyGo: {
      question: lang === 'bn' ? 'চলতি মাসে টাকা কোথায় খরচ হলো?' : 'Where did my money go this month?',
      answer: lang === 'bn'
        ? `চলতি মাসে আপনার মোট ব্যয় ৳${currentMonthExpense.toLocaleString()}। সর্বাধিক ব্যয় হয়েছে শীর্ষ খাতগুলোতে। আপনার সঞ্চয় হার ছিল ${savingsRate}%।`
        : `You spent ৳${currentMonthExpense.toLocaleString()} this month across all categories. Your net savings surplus stands at ৳${Math.max(0, netCashFlow).toLocaleString()} (${savingsRate}% savings rate).`,
      highlights: Object.entries(currentCategoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => ({
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          amount: amt,
        })),
    },
    howIsModePerforming: {
      question: lang === 'bn' ? 'আমার আর্থিক ড্রাইভিং মোড কেমন চলছে?' : 'How is my driving mode performing?',
      answer: lang === 'bn'
        ? `আপনি বর্তমানে ${financialMode.toUpperCase()} মোডে আছেন। আপনার লক্ষ্য ${targetSavingRate}% সঞ্চয়, আর আপনি অর্জন করেছেন ${savingsRate}%। ${modeCompliant ? 'অভিনন্দন! আপনি সঠিক গতিতে এগোচ্ছেন।' : 'বাজেট নিয়ন্ত্রণে কিছুটা সতর্কতা প্রয়োজন।'}`
        : `Active Mode: ${financialMode.toUpperCase()}. Target: ${targetSavingRate}% savings rate. Current Pace: ${savingsRate}%. Status: ${modeCompliant ? 'Fully Compliant & Ahead of Curve' : 'Needs Minor Calibration'}.`,
    },
    safeToSpendDaily: {
      question: lang === 'bn' ? 'আজকের নিরাপদ ব্যয় সীমা কত?' : 'What is my daily safe-to-spend limit?',
      answer: lang === 'bn'
        ? `চলতি মাসের অবশিষ্ট দিনগুলির জন্য আপনার দৈনিক নিরাপদ খরচের সীমা প্রায় ৳${avgDailyBurn.toLocaleString()}। এই সীমার মধ্যে থাকলে সঞ্চয় অক্ষুণ্ণ থাকবে।`
        : `Your recommended daily spending allowance is ৳${avgDailyBurn.toLocaleString()} per day. Staying below this threshold guarantees hitting your monthly savings goals.`,
    },
    howToSaveExtra5k: {
      question: lang === 'bn' ? 'আরও ৳৫,০০০ কীভাবে সঞ্চয় করব?' : 'How can I save an extra ৳5,000 this month?',
      answer: lang === 'bn'
        ? `প্রতিদিন গড়ে মাত্র ৳১৬৫ খরচ কমালে মাস শেষে সহজেই অতিরিক্ত ৳৫,০০০ সঞ্চয় হবে। রেস্তোরাঁ ও অনলাইনের কেনাকাটা সামান্য সীমিত করলেই এটি সম্ভব।`
        : `Reducing daily discretionary spending by just ৳165/day frees up ৳5,000 every month. Reallocating this into a recurring 7% DPS builds ৳3.2 Lakh over 4 years.`,
    },
  };

  return {
    score,
    scoreTier,
    scoreLabel,
    scoreColor,
    totalNetWorth,
    totalBalance,
    liquidBalance,
    lockedInSavings,
    runwayMonths,
    avgDailyBurn,
    monthlyBurn,
    currentMonthIncome,
    currentMonthExpense,
    netCashFlow,
    savingsRate,
    targetSavingRate,
    modeCompliant,
    insights,
    queryAnswers,
    categorySpikes,
  };
}
