import React from 'react';

/**
 * Hisab (হিসাব) Official Brand Logo — "The Growth h Logo"
 * Based on Hisab Brand Identity Guidelines v1.0 (September 2024)
 *
 * Variants:
 * - 'charcoal' (default): #111111 squircle with #9EFF33 Electric Lime Growth 'h'
 * - 'twotone': Deep Charcoal stem/arch with 3 Electric Lime ascending growth bars
 * - 'lime': Pure Electric Lime mark
 * - 'symbol': Just the glyph without squircle background
 */
export default function HisabLogo({
  variant = 'charcoal',
  size = 36,
  showWordmark = false,
  showTagline = false,
  className = '',
  style = {},
}) {
  // Electric Lime from Brand Guidelines: #9EFF33 (or platform #5ED21C)
  const limeColor = '#9EFF33';
  const charcoalColor = '#111111';

  // The Growth 'h' Symbol Glyph
  const renderGlyph = (isTwoTone = false) => {
    if (isTwoTone) {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Top Left Stem (Deep Charcoal) */}
          <rect x="20" y="16" width="16" height="44" rx="2" fill={charcoalColor} />

          {/* Arch (Deep Charcoal with clean diagonal connection) */}
          <path
            d="M 36 38 C 42 29.5 50 27 60 27 C 67.5 27 73 30.5 75.5 36.5 L 66 44 C 64.5 41 61.5 38.5 57.5 38.5 C 50.5 38.5 44 43 42 50 L 36 47 Z"
            fill={charcoalColor}
          />

          {/* Bar 1 (Short Growth Bar at bottom-left) */}
          <rect x="20" y="66" width="16" height="18" rx="2" fill={limeColor} />

          {/* Bar 2 (Medium Growth Bar in center - 50% height) */}
          <rect x="42" y="48" width="16" height="36" rx="2" fill={limeColor} />

          {/* Bar 3 (Right Growth Leg with angled top) */}
          <path
            d="M 62 47.5 L 76.5 37.5 C 77.5 39 78 41 78 43.5 L 78 82 C 78 83.1 77.1 84 76 84 L 64 84 C 62.9 84 62 83.1 62 82 Z"
            fill={limeColor}
          />
        </svg>
      );
    }

    // Unified Charcoal App Icon Glyph
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {variant === 'charcoal' && (
          <rect width="100" height="100" rx="24" fill={charcoalColor} />
        )}

        {/* The 'h' Letterform (Top Left Stem + Arch + Right Leg) */}
        <path
          d="M 20 18 C 20 16.9 20.9 16 22 16 L 34 16 C 35.1 16 36 16.9 36 18 L 36 38 C 42 29 50 27 60 27 C 70 27 78 33.5 78 44 L 78 82 C 78 83.1 77.1 84 76 84 L 64 84 C 62.9 84 62 83.1 62 82 L 62 47 C 62 41 58.5 38.5 53 38.5 C 46.5 38.5 42 42.5 41 49 L 41 60 C 41 61.1 40.1 62 39 62 L 22 62 C 20.9 62 20 61.1 20 60 Z"
          fill={limeColor}
        />

        {/* Bar 1 (Short Growth Bar at bottom-left) */}
        <rect x="20" y="68" width="16" height="16" rx="2" fill={limeColor} />

        {/* Bar 2 (Medium Growth Bar in center - 50% height) */}
        <rect x="41" y="48" width="16" height="36" rx="2" fill={limeColor} />
      </svg>
    );
  };

  const isTwoTone = variant === 'twotone';

  if (!showWordmark) {
    return (
      <div
        className={`hisab-logo ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
          ...style,
        }}
        aria-label="Hisab Logo"
      >
        {renderGlyph(isTwoTone)}
      </div>
    );
  }

  return (
    <div
      className={`hisab-logo-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.max(10, Math.round(size * 0.28)),
        flexShrink: 0,
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
      aria-label="Hisab Brand"
    >
      {renderGlyph(isTwoTone)}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
            fontSize: `${Math.round(size * 0.72)}px`,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: isTwoTone ? '#111111' : 'var(--color-text-primary, #111111)',
            lineHeight: 1.05,
          }}
        >
          Hisab
        </span>
        {showTagline && (
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: `${Math.max(9, Math.round(size * 0.25))}px`,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--color-text-tertiary, #667064)',
              textTransform: 'uppercase',
              marginTop: '2px',
              lineHeight: 1,
            }}
          >
            Personal Finance
          </span>
        )}
      </div>
    </div>
  );
}
