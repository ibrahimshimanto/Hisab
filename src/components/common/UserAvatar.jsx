import { getAvatarConfig } from '../../lib/avatars.js';

export default function UserAvatar({
  avatar,
  name = 'User',
  size = 38,
  border = '1.5px solid #5ED21C',
  className = '',
  style = {},
}) {
  const config = getAvatarConfig(avatar);
  const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';

  const baseStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    userSelect: 'none',
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
    border: border || 'none',
    ...style,
  };

  if (config) {
    return (
      <div
        className={`user-avatar ${className}`}
        style={{
          ...baseStyle,
          background: config.bg,
          fontSize: `${Math.round(size * 0.52)}px`,
          lineHeight: 1,
        }}
        title={config.labelEn}
      >
        <span>{config.emoji}</span>
      </div>
    );
  }

  // Fallback initial
  return (
    <div
      className={`user-avatar ${className}`}
      style={{
        ...baseStyle,
        background: 'linear-gradient(135deg, #111411 0%, #2A302A 100%)',
        color: '#FFFFFF',
        fontWeight: 'var(--weight-black)',
        fontSize: `${Math.round(size * 0.42)}px`,
      }}
    >
      <span>{initial}</span>
    </div>
  );
}
