import { useEffect, useId, useRef, useState } from 'react';
import SignOutIcon from '@/components/layout/SignOutIcon';
import { useAuth } from '@/hooks/useAuth';
import { initials } from '@/utils/format';

/** Phone header for the planner: the logo, and an account menu with sign out. From lg up the sidebar is used. */
export default function PlannerTopBar() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // Escape closes the menu and puts focus back on its button; a tap anywhere else just closes it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <header className="relative flex h-16 items-center justify-between bg-ink px-4 text-canvas lg:hidden">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-[11px] bg-brand font-display text-xl font-extrabold text-white">
          G
        </span>
        <span className="font-display text-xl font-bold tracking-tight">GatherOS</span>
      </div>

      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        className="flex size-11 items-center justify-center rounded-full bg-ink-line text-[13px] font-semibold transition-colors hover:bg-ink-track"
      >
        {initials(session?.name ?? '')}
      </button>

      {open && (
        <div
          ref={menu}
          id={menuId}
          className="absolute top-14 right-3 z-30 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-ink-line bg-ink-raised p-3 shadow-lg"
        >
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-semibold">{session?.name}</p>
            <p className="truncate text-xs text-ink-text-3" title={session?.email}>
              {session?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-2 text-sm text-ink-text transition-colors hover:bg-ink-active/60 hover:text-white"
          >
            <SignOutIcon className="size-4.5" />
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
