const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat('en-US');

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

export const CATEGORY_LABELS = {
  workshop: 'Workshop',
  keynote: 'Keynote',
  meal: 'Meal',
  activity: 'Activity',
} as const;

export interface CategoryStyle {
  /** Chip: tinted background with dark text. */
  badge: string;
  /** Solid marker color. */
  dot: string;
  /** Dashed ring border (stamps, timeline stops). */
  ring: string;
  /** Text that stays legible on white. */
  text: string;
}

// Full class names so Tailwind can detect them statically.
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  keynote: { badge: 'bg-brand-tint text-brand-ink', dot: 'bg-brand', ring: 'border-brand', text: 'text-brand-ink' },
  workshop: { badge: 'bg-blue-tint text-blue-ink', dot: 'bg-blue', ring: 'border-blue', text: 'text-blue-ink' },
  meal: { badge: 'bg-orange-tint text-warn-ink', dot: 'bg-orange', ring: 'border-orange', text: 'text-warn-ink' },
  activity: { badge: 'bg-ok-tint text-ok-ink', dot: 'bg-ok', ring: 'border-ok', text: 'text-ok-ink' },
};

const FALLBACK_STYLE: CategoryStyle = {
  badge: 'bg-hairline text-body',
  dot: 'bg-muted',
  ring: 'border-muted',
  text: 'text-body',
};

export function categoryLabel(category: string): string {
  return category in CATEGORY_LABELS
    ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]
    : category;
}

export function categoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
}

export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
