import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/modalHelper.js';
import { Mic, MicOff, Volume2, X, Check, ArrowRight, Sparkles, RefreshCw, AlertCircle, CornerDownLeft } from 'lucide-react';
import useStore from '../../store/useStore.js';
import { useTranslation } from '../../i18n/index.jsx';
import { parseVoiceInput } from '../../utils/voiceParser.js';

export default function VoiceModal() {
  const { t, lang, formatCurrency } = useTranslation();
  const { voiceModal, closeVoiceModal, categories, accounts, addTransactionFromVoice } = useStore();
  const isOpen = voiceModal.isOpen;

  const [isListening, setIsListening] = useState(false);
  const [sentence, setSentence] = useState('');
  const [interim, setInterim] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [recognitionLang, setRecognitionLang] = useState(lang === 'bn' ? 'bn-BD' : 'en-US');
  const [isSaved, setIsSaved] = useState(false);

  const recognitionRef = useRef(null);
  const sentenceRef = useRef('');
  const isListeningRef = useRef(false);
  const isAssessedRef = useRef(false);
  const inputRef = useRef(null);

  // Sync recognitionLang with app lang on open & lock scroll
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
      setRecognitionLang(lang === 'bn' ? 'bn-BD' : 'en-US');
      setSentence('');
      sentenceRef.current = '';
      setInterim('');
      setParsed(null);
      setError(null);
      setIsSaved(false);
      isAssessedRef.current = false;
    }
    return () => {
      if (isOpen) {
        unlockBodyScroll();
      }
    };
  }, [isOpen, lang]);

  // Speech feedback helper
  const speakFeedback = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = recognitionLang;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore speech synthesis errors
    }
  }, [recognitionLang]);

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  // Start continuous listening
  const startListening = useCallback(() => {
    setError(null);
    setInterim('');
    setParsed(null);
    setIsSaved(false);
    isAssessedRef.current = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে ভয়েস রিকগনিশন সমর্থিত নয়। Chrome বা Edge ব্যবহার করুন।'
          : 'Speech recognition is not supported in this browser. Please use Chrome or Safari.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = recognitionLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let accumulatedFinal = sentenceRef.current;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            const chunk = res[0].transcript.trim();
            if (chunk) {
              accumulatedFinal = accumulatedFinal ? `${accumulatedFinal} ${chunk}` : chunk;
            }
          } else {
            currentInterim += res[0].transcript;
          }
        }

        sentenceRef.current = accumulatedFinal;
        setSentence(accumulatedFinal);
        setInterim(currentInterim);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
          setError(
            lang === 'bn'
              ? 'মাইক্রোফোন ব্যবহারের অনুমতি নেই। ব্রাউজার সেটিংসে গিয়ে অনুমতি দিন।'
              : 'Microphone access blocked. Please grant microphone permissions.'
          );
        } else if (event.error === 'no-speech') {
          // ignore transient no-speech in continuous mode
        } else {
          setError(event.error);
        }
      };

      recognition.onend = () => {
        // If still flagged as listening and user hasn't assessed yet, keep speech recognition alive
        if (isListeningRef.current && !isAssessedRef.current) {
          try {
            recognition.start();
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (err) {
      isListeningRef.current = false;
      setIsListening(false);
      setError(err.message || 'Failed to initialize speech recognition');
    }
  }, [recognitionLang, lang]);

  // Clean up when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      stopListening();
    } else {
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopListening();
      };
    }
  }, [isOpen, startListening, stopListening]);

  // Assess Sentence with Voice AI
  const handleAssess = useCallback((textOverride) => {
    isAssessedRef.current = true;
    stopListening();

    const textToAssess = (
      typeof textOverride === 'string'
        ? textOverride
        : (sentence + (interim ? ' ' + interim : '')).trim()
    ).trim();

    if (!textToAssess) {
      setError(
        lang === 'bn'
          ? 'অনুগ্রহ করে প্রথমে কথা বলুন বা বাক্য লিখুন।'
          : 'Please speak or type your transaction sentence first.'
      );
      return;
    }

    setError(null);
    setInterim('');
    setSentence(textToAssess);
    sentenceRef.current = textToAssess;

    // Run Natural Language Parser
    const res = parseVoiceInput(textToAssess, { categories, accounts });
    setParsed(res);
  }, [sentence, interim, stopListening, categories, accounts, lang]);

  // Handle Save
  const handleSave = useCallback(() => {
    if (!parsed || !parsed.success) return;

    addTransactionFromVoice(parsed);
    setIsSaved(true);

    const feedbackMsg =
      lang === 'bn'
        ? `${parsed.amount} টাকা ${parsed.type === 'income' ? 'আয়' : 'খরচ'} সফলভাবে যুক্ত হয়েছে!`
        : `${formatCurrency(parsed.amount)} ${parsed.type} recorded successfully!`;

    speakFeedback(feedbackMsg);

    setTimeout(() => {
      closeVoiceModal();
    }, 1200);
  }, [parsed, addTransactionFromVoice, lang, formatCurrency, speakFeedback, closeVoiceModal]);

  // Enter Key Handler (Press Enter to Assess, or Press Enter to Confirm & Save)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (parsed && parsed.success && !isSaved) {
        handleSave();
      } else {
        handleAssess();
      }
    }
  }, [parsed, isSaved, handleSave, handleAssess]);

  // Sample prompt test (for quick testing or when mic is unavailable)
  const handleSampleClick = (sample) => {
    handleAssess(sample);
  };

  // Restart / Edit flow
  const handleRetry = () => {
    setParsed(null);
    setSentence('');
    sentenceRef.current = '';
    setInterim('');
    setError(null);
    setIsSaved(false);
    startListening();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  const displaySentence = sentence + (interim ? (sentence ? ' ' : '') + interim : '');

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={closeVoiceModal}>
      <div
        className="modal voice-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{ maxWidth: 520 }}
      >
        {/* Modal Header */}
        <div className="voice-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="voice-badge">
              <Sparkles size={13} color="#5ED21C" />
              <span>AI Voice Input</span>
            </div>
            {/* Language Switcher */}
            <div className="voice-lang-tabs">
              <button
                type="button"
                className={`voice-lang-btn ${recognitionLang === 'en-US' ? 'active' : ''}`}
                onClick={() => {
                  setRecognitionLang('en-US');
                  stopListening();
                }}
              >
                EN
              </button>
              <button
                type="button"
                className={`voice-lang-btn ${recognitionLang === 'bn-BD' ? 'active' : ''}`}
                onClick={() => {
                  setRecognitionLang('bn-BD');
                  stopListening();
                }}
              >
                বাংলা
              </button>
            </div>
          </div>
          <button type="button" className="btn btn-icon btn-ghost btn-sm" onClick={closeVoiceModal}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="voice-modal-body">
          {/* Pulsing Audio Waveform Visualizer */}
          <div className={`voice-visualizer-wrap ${isListening ? 'listening' : ''}`}>
            <div className="voice-wave-ring ring-1" />
            <div className="voice-wave-ring ring-2" />
            <button
              type="button"
              className={`voice-mic-main-btn ${isListening ? 'active' : ''}`}
              onClick={isListening ? stopListening : startListening}
              title={isListening ? 'Stop Mic' : 'Start Mic'}
            >
              {isListening ? <Mic size={32} /> : <MicOff size={32} />}
            </button>
          </div>

          {/* Dynamic Status Text */}
          <div className="voice-status-text">
            {parsed && parsed.success ? (
              <span style={{ color: 'var(--color-primary-dark)', fontWeight: 'var(--weight-bold)' }}>
                {lang === 'bn'
                  ? '✨ লেনদেন শনাক্ত হয়েছে! সংরক্ষণ করতে Enter ↵ চাপুন'
                  : '✨ Transaction detected! Press Enter ↵ to save'}
              </span>
            ) : isListening ? (
              <span>
                {lang === 'bn'
                  ? '🎙️ আপনার পুরো বাক্যটি বলুন। শেষ হলে Enter ↵ চাপুন'
                  : '🎙️ Speak your full sentence. Press Enter ↵ when done'}
              </span>
            ) : (
              <span>
                {lang === 'bn'
                  ? 'কথা বলা বা টাইপ শেষ হলে Enter ↵ চাপুন'
                  : 'Finish speaking or typing, then press Enter ↵ to assess'}
              </span>
            )}
          </div>

          {/* Soundwave Frequency Bars (shown while actively listening) */}
          {isListening && (
            <div className="soundwave-bars">
              <span className="soundwave-bar b-1" />
              <span className="soundwave-bar b-2" />
              <span className="soundwave-bar b-3" />
              <span className="soundwave-bar b-4" />
              <span className="soundwave-bar b-5" />
              <span className="soundwave-bar b-6" />
              <span className="soundwave-bar b-7" />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="voice-error-alert animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Sentence Input Box with Enter ↵ Action */}
          <div className="voice-input-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="voice-input-label">
                {lang === 'bn' ? 'আপনার বক্তব্য (বলা বা টাইপ করুন):' : 'Spoken Sentence (Speak or Type):'}
              </span>
              <span className="voice-kbd-pill">
                <CornerDownLeft size={11} />
                <span>Enter ↵</span>
              </span>
            </div>

            <div className="voice-input-action-row">
              <input
                ref={inputRef}
                type="text"
                className="voice-sentence-input"
                placeholder={
                  recognitionLang === 'bn-BD'
                    ? 'যেমন: ৫০০ টাকা খাবার খরচ বিকাশে...'
                    : 'e.g. Add expense 500 for food to bank...'
                }
                value={displaySentence}
                onChange={(e) => {
                  setSentence(e.target.value);
                  sentenceRef.current = e.target.value;
                  setInterim('');
                }}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="btn btn-lime btn-sm voice-enter-btn"
                onClick={() => handleAssess()}
                title="Assess with Voice AI (Enter ↵)"
              >
                <CornerDownLeft size={15} />
                <span>{lang === 'bn' ? 'যাচাই ↵' : 'Assess ↵'}</span>
              </button>
            </div>

            <div className="voice-input-hint">
              {lang === 'bn'
                ? '💡 বাক্য বলা শেষ করে কীবোর্ডের Enter চাপুন, ভয়েস এআই স্বয়ংক্রিয় যাচাই করবে।'
                : '💡 Finish your sentence and press Enter. Voice AI will immediately evaluate it.'}
            </div>
          </div>

          {/* Parsed Result Preview Card */}
          {parsed && (
            <div className="voice-parsed-card animate-fade-in-up">
              {parsed.success ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="parsed-tag-title">
                      {lang === 'bn' ? 'শনাক্তকৃত লেনদেন:' : 'Detected Transaction:'}
                    </span>
                    <span
                      className={`badge ${parsed.type === 'income' ? 'badge-income' : 'badge-expense'}`}
                      style={{ textTransform: 'uppercase' }}
                    >
                      {parsed.type}
                    </span>
                  </div>

                  <div className="parsed-amount-row">
                    <span className="parsed-amount">{formatCurrency(parsed.amount)}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span
                        className="parsed-category-badge"
                        style={{
                          backgroundColor: `${parsed.categoryColor}20`,
                          color: parsed.categoryColor,
                          border: `1px solid ${parsed.categoryColor}50`,
                        }}
                      >
                        {parsed.categoryId.toUpperCase()}
                      </span>
                      {parsed.accountName && (
                        <span className="parsed-account-badge">{parsed.accountName}</span>
                      )}
                    </div>
                  </div>

                  {isSaved ? (
                    <div className="voice-saved-banner animate-fade-in">
                      <Check size={18} />
                      <span>{lang === 'bn' ? 'সফলভাবে যুক্ত হয়েছে!' : 'Saved Successfully!'}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleRetry}
                        style={{ flex: 1 }}
                      >
                        <RefreshCw size={14} />
                        <span>{lang === 'bn' ? 'পুনরায় বলুন' : 'Speak Again'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-lime btn-sm"
                        onClick={handleSave}
                        style={{ flex: 2, gap: 6 }}
                      >
                        <Check size={16} />
                        <span>{lang === 'bn' ? 'নিশ্চিত করুন (Enter ↵)' : 'Confirm & Save (Enter ↵)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="parsed-error-msg">
                  <AlertCircle size={16} />
                  <span>{parsed.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Clickable Suggestions / Examples */}
          <div className="voice-suggestions-wrap">
            <span className="voice-suggestions-title">
              {lang === 'bn' ? 'টেস্ট করতে ট্যাপ করুন:' : 'Tap to test sentence:'}
            </span>
            <div className="voice-suggestions-list">
              {(recognitionLang === 'bn-BD'
                ? [
                    '৫০০ টাকা খাবার খরচ',
                    'বেতন ২৫০০০ টাকা জমা',
                    'রিকশা ভাড়া ৬০ টাকা',
                    'মুদি বাজার ১২০০ টাকা',
                  ]
                : [
                    'Add expense 500 for food',
                    'Income 25000 salary to bank',
                    'Uber ride 350 taka',
                    'Grocery shopping 1400',
                  ]
              ).map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="voice-sample-chip"
                  onClick={() => handleSampleClick(sample)}
                >
                  <span>"{sample}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
