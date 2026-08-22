import { ReadinessState } from '@/types';

interface ReadinessBadgeProps {
  state: ReadinessState;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ReadinessBadge({ state, score, size = 'md' }: ReadinessBadgeProps) {
  let badgeClass = 'badge-ready';
  let label = 'READY';
  let icon = '✓';

  if (state === 'ALMOST_READY') {
    badgeClass = 'badge-almost';
    label = 'ALMOST READY';
    icon = '⚡';
  } else if (state === 'NOT_READY') {
    badgeClass = 'badge-not-ready';
    label = 'NOT READY';
    icon = '✕';
  }

  const padding = size === 'sm' ? '0.2rem 0.5rem' : size === 'lg' ? '0.5rem 1rem' : '0.35rem 0.75rem';
  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.85rem';

  return (
    <div
      className={badgeClass}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding,
        borderRadius: '20px',
        fontSize,
        fontWeight: '700',
        letterSpacing: '0.03em',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {score !== undefined && (
        <span style={{ opacity: 0.85, fontWeight: '800', marginLeft: '0.2rem' }}>
          ({score.toFixed(0)}%)
        </span>
      )}
    </div>
  );
}
