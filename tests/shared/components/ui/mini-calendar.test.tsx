import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MiniCalendar } from '@/shared/components/ui/mini-calendar';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

describe('MiniCalendar', () => {
  it('disables dates before an explicit minimum date', () => {
    const onDayClickAction = vi.fn();

    render(
      <MiniCalendar
        selected={new Date('2026-07-30T00:00:00Z')}
        minDate={new Date('2026-07-30T00:00:00Z')}
        onDayClickAction={onDayClickAction}
      />,
    );

    const disabledTwentyNinth = screen
      .getAllByRole('button', { name: '29' })
      .find((button) => button.hasAttribute('disabled'));

    expect(disabledTwentyNinth).toBeDisabled();
    disabledTwentyNinth?.click();
    expect(onDayClickAction).not.toHaveBeenCalled();
  });
});
