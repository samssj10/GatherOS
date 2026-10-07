import { useDroppable } from '@dnd-kit/core';
import { Check, Plus } from 'lucide-react';
import { CHIP_PREFIX } from '@/utils/dropTarget';

interface DroppableDayChipProps {
  day: number;
  onPage: boolean;
  /** The day the dragged card comes from; null when nothing is being dragged. */
  sourceDay: number | null;
  /** The day that just received a card, flashing lime for a moment. */
  flashing: boolean;
  /** True while a keyboard drag has this button focused: it looks and speaks like a hovered target. */
  keyboardTarget: boolean;
  onBlur: () => void;
  onSelect: () => void;
}

/** One Day button: a jump link when idle, a drop target for a dragged card while dragging. */
export function DroppableDayChip({ day, onPage, sourceDay, flashing, keyboardTarget, onBlur, onSelect }: DroppableDayChipProps) {
  const dragging = sourceDay !== null;
  const isSource = sourceDay === day;
  const { setNodeRef, isOver } = useDroppable({
    id: `${CHIP_PREFIX}${day}`,
    data: { day },
    disabled: !dragging || isSource,
  });
  const target = dragging && !isSource;
  const hovered = target && (isOver || keyboardTarget);

  // One state wins at a time: the lime flash after a drop, the hover ring, the dashed "you can drop here" hint, then idle.
  let look: string;
  if (flashing) look = 'border-lime bg-lime text-ink';
  else if (hovered)
    look = 'border-brand bg-brand-tint text-brand-ink ring-4 ring-brand/20 motion-safe:scale-[1.06]';
  else if (target)
    look = onPage ? 'border-dashed border-brand-soft bg-ink text-white' : 'border-dashed border-brand bg-white text-ink';
  else look = onPage ? 'border-ink bg-ink text-white hover:bg-ink-active' : 'border-field bg-white text-ink hover:bg-wash';

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      onBlur={onBlur}
      data-day={day}
      aria-current={onPage ? 'true' : undefined}
      // The dashed border is 2px wide, so the side padding gives up a pixel to keep the button the same size.
      className={`relative inline-flex min-h-11 items-center gap-1.5 lg:min-h-10 rounded-[10px] border text-sm font-medium transition-[scale,background-color,box-shadow,opacity] ${
        target || flashing ? 'border-2 px-[13px]' : 'px-3.5'
      } ${isSource ? 'opacity-40' : ''} ${look}`}
    >
      {flashing && <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" />}
      {!flashing && hovered && <Plus className="size-3.5" strokeWidth={2.4} aria-hidden="true" />}
      Day {day}
      {hovered && !flashing && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
        >
          Drop to add to end of Day {day}
        </span>
      )}
    </button>
  );
}
