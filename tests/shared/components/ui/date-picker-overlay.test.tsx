import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateInputFloat } from '@/shared/components/ui/date-input-float';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { DateRangePicker } from '@/shared/components/ui/date-range-picker';
import { DateTimePicker } from '@/shared/components/ui/date-time-picker';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/shared/stores/use-user-store', () => ({
  useDateFormat: () => 'DD.MM.YYYY',
}));

const VALUE = new Date('2026-08-01T10:30:00Z');

function expectOpenPopover() {
  const content = document.querySelector('[data-slot="popover-content"]');
  expect(content).toBeInTheDocument();
  expect(content).toHaveAttribute('data-align', 'start');
  expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeInTheDocument();
}

describe('date picker overlays', () => {
  it('opens DatePicker in a start-aligned popover by default and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(<DatePicker value={VALUE} onChangeAction={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: /01\.08\.2026/ });

    await user.click(trigger);
    expectOpenPopover();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('opens DatePicker in a dialog when requested', async () => {
    const user = userEvent.setup();
    render(<DatePicker overlay="dialog" value={VALUE} onChangeAction={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /01\.08\.2026/ }));

    expect(document.querySelector('[data-slot="dialog-content"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="popover-content"]')).not.toBeInTheDocument();
  });

  it('opens DateTimePicker in a popover by default', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker value={VALUE} onChangeAction={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /01\.08\.2026.*10:30/ }));

    expectOpenPopover();
  });

  it('opens DateRangePicker in a popover by default', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker />);

    await user.click(screen.getByRole('button', { name: /startDate.*endDate/ }));

    expectOpenPopover();
  });

  it('keeps DateRangePicker Apply disabled until a complete range is selected', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker />);

    await user.click(screen.getByRole('button', { name: /startDate.*endDate/ }));

    expect(screen.getByRole('button', { name: 'apply' })).toBeDisabled();

    const firstAvailableDay = screen
      .getAllByTestId('date-day-cell')
      .find((day) => !day.hasAttribute('disabled'));
    expect(firstAvailableDay).toBeDefined();
    await user.click(firstAvailableDay!);

    expect(screen.getByRole('button', { name: 'apply' })).toBeDisabled();
  });

  it('keeps DateRangePicker Apply disabled when the selected end precedes the start', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker />);
    await user.click(screen.getByRole('button', { name: /startDate.*endDate/ }));

    const availableDays = screen
      .getAllByTestId('date-day-cell')
      .filter((day) => !day.hasAttribute('disabled'))
      .sort((a, b) => (a.getAttribute('data-date') ?? '').localeCompare(b.getAttribute('data-date') ?? ''));
    expect(availableDays.length).toBeGreaterThan(1);

    await user.click(availableDays[1]);
    await user.click(availableDays[0]);

    expect(screen.getByRole('button', { name: 'apply' })).toBeDisabled();
  });

  it('forwards the DateInputFloat overlay mode to DateTimePicker', async () => {
    const user = userEvent.setup();
    render(
      <DateInputFloat
        overlay="dialog"
        value={VALUE}
        onChangeAction={vi.fn()}
        dateLabel="Date"
        timeLabel="Time"
      />,
    );

    await user.click(screen.getByRole('button', { name: /Date.*01\.08\.2026.*Time.*10:30/ }));

    expect(document.querySelector('[data-slot="dialog-content"]')).toBeInTheDocument();
  });
});
