import type { Active, Over } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '@/types';
import { CHIP_PREFIX, COLUMN_PREFIX, resolveDrop } from './dropTarget';

const item = (id: string, day: number, startTime: string): ScheduleItem => ({
  id,
  day,
  startTime,
  endTime: '23:00',
  title: id,
  description: '',
  location: '',
  category: 'workshop',
  costEstimate: 0,
});

const items = [
  item('a', 1, '09:00'),
  item('b', 1, '11:00'),
  item('c', 4, '09:00'),
  item('d', 4, '13:00'),
];

const active = (id: string, translated: { top: number; height: number } | null = null) =>
  ({ id, rect: { current: { translated } } }) as unknown as Active;
const over = (id: string, rect = { top: 0, height: 100 }) => ({ id, rect }) as unknown as Over;

describe('resolveDrop', () => {
  it('does nothing when nothing is under the card', () => {
    expect(resolveDrop(active('a'), null, items)).toBeNull();
  });

  it('puts a card dropped on a Day button at the end of that day', () => {
    expect(resolveDrop(active('a'), over(`${CHIP_PREFIX}4`), items)).toEqual({
      day: 4,
      orderedIds: ['c', 'd', 'a'],
      index: 2,
      crossDay: true,
      viaDayButton: true,
    });
  });

  it('puts a card dropped on an empty day at the start of it', () => {
    expect(resolveDrop(active('a'), over(`${CHIP_PREFIX}6`), items)).toMatchObject({
      day: 6,
      orderedIds: ['a'],
      index: 0,
      viaDayButton: true,
    });
  });

  it('ignores a drop on the Day button of the card\'s own day', () => {
    expect(resolveDrop(active('a'), over(`${CHIP_PREFIX}1`), items)).toBeNull();
  });

  it('treats a column\'s empty space the same way, but not as a Day button', () => {
    expect(resolveDrop(active('b'), over(`${COLUMN_PREFIX}4`), items)).toMatchObject({
      day: 4,
      orderedIds: ['c', 'd', 'b'],
      viaDayButton: false,
    });
    expect(resolveDrop(active('b'), over(`${COLUMN_PREFIX}1`), items)).toBeNull();
  });

  it('reorders within a day when dropped on a card of the same day', () => {
    expect(resolveDrop(active('a'), over('b'), items)).toMatchObject({
      day: 1,
      orderedIds: ['b', 'a'],
      crossDay: false,
    });
  });

  it('lands before or after a card on another day depending on the pointer half', () => {
    const upper = resolveDrop(active('a', { top: 0, height: 40 }), over('c', { top: 100, height: 100 }), items);
    expect(upper).toMatchObject({ day: 4, orderedIds: ['a', 'c', 'd'], index: 0 });
    const lower = resolveDrop(active('a', { top: 160, height: 40 }), over('c', { top: 100, height: 100 }), items);
    expect(lower).toMatchObject({ day: 4, orderedIds: ['c', 'a', 'd'], index: 1 });
  });

  it('ignores a drop on itself or on an unknown card', () => {
    expect(resolveDrop(active('a'), over('a'), items)).toBeNull();
    expect(resolveDrop(active('a'), over('zzz'), items)).toBeNull();
    expect(resolveDrop(active('nope'), over('b'), items)).toBeNull();
  });
});
