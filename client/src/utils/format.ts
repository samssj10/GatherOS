const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

export const CATEGORY_LABELS = {
  workshop: 'Workshop',
  keynote: 'Keynote',
  meal: 'Meal',
  activity: 'Activity',
} as const;

// Full class names so Tailwind can detect them statically.
export const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  workshop: { badge: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-600' },
  keynote: { badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-600' },
  meal: { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  activity: { badge: 'bg-teal-50 text-teal-700', dot: 'bg-teal-600' },
};

export function categoryLabel(category: string): string {
  return category in CATEGORY_LABELS
    ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]
    : category;
}

export function categoryStyle(category: string): { badge: string; dot: string } {
  return CATEGORY_STYLES[category] ?? { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' };
}
