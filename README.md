# Hisab (হিসাব) — Neo-Fintech Personal Finance Platform

> A luxury, bilingual (English & বাংলা) personal finance and wealth management system engineered with React, Zustand, Chart.js, and Supabase.

![Hisab Preview](public/hisab-logo.svg)

---

## ✨ Features

- **💳 Multi-Source Account Management**:
  - Seamless tracking for Bangladeshi Mobile Financial Services (bKash, Nagad, Rocket), Banks (City Bank, DBBL, etc.), and Cash Wallets.
  - Interactive balance adjustment logs and inter-account transfers.
- **🎙️ Bilingual Voice Assistant**:
  - Web Speech API integration with natural language processing for English & Bengali commands (e.g. *"Expense 500 for food"*, *"৫০০ টাকা খাবার খরচ"*).
  - Live audio visualizer and 1-tap confirmation.
- **🏎️ Financial Driving Engine (Eco, Cruise, Racing)**:
  - Dynamic modes to calibrate savings velocity and daily safe-to-spend allowance:
    - 🍃 **Eco Mode**: High savings accumulation (40% default target)
    - ⚡ **Cruise Mode**: Balanced lifestyle budgeting (20% default target)
    - 🏎️ **Racing Mode**: Aggressive capital expansion (5% default target)
  - Interactive engine tuning sliders with instant parameter recalibration.
- **🏦 Savings Goals & Locked Funds (DPS & FDR)**:
  - Multi-scheme savings manager with locked maturity countdowns and interest yield projections.
  - Emergency funds and milestone purchase goals.
- **🔄 User-Managed Recurring Bills & Subscriptions**:
  - Monthly rent, utilities, and internet subscription tracking with due date status badges (`Paid`, `Due Soon`, `Overdue`).
  - 1-tap full-width center-aligned "Pay / Mark Paid" action.
- **📊 Analytics Hub & Spending Heatmap**:
  - Cash flow waterfall dynamics and interactive daily spending heatmap with real-time calendar stepper.
- **☁️ Supabase Cloud Sync & Authentication (Phase 2)**:
  - Bi-directional sync with an offline-first architecture (works 100% offline via localStorage).
  - 1-tap Google OAuth and passwordless Email OTP / magic code sign-in.
  - Strict Row Level Security (RLS) PostgreSQL schema.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **State Management**: Zustand (with localStorage persistence & background delta cloud sync)
- **Styling**: Modern Vanilla CSS, Apple HIG & Material 3 inspired tokens, Glassmorphism
- **Charts**: Chart.js & react-chartjs-2
- **Icons**: Lucide React
- **Cloud Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Internationalization**: Full English & Bengali (বাংলা) i18n support

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ibrahimshimanto/Hisab.git
cd Hisab
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Supabase (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(Note: If you run without Supabase credentials, Hisab automatically operates in 100% Local-First mode without errors).*

### 4. Run database migration (If using Supabase)
Paste the contents of `supabase_schema.sql` into your Supabase project's **SQL Editor** and click **Run**.

### 5. Start the development server
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Live Demo

- **Production**: [https://hisab-psi-eight.vercel.app](https://hisab-psi-eight.vercel.app)

---

## 📄 License

MIT © [Ibrahim Shimanto](https://github.com/ibrahimshimanto)