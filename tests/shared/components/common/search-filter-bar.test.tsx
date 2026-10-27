import type { SVGProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/messages/en.json';
import { SearchFilterBar } from '@/shared/components/common/search-filter-bar';

vi.mock('lucide-react', async (importOriginal) => {
  const icons = await importOriginal<typeof import('lucide-react')>();

  return {
    ...icons,
    ListFilter: (props: SVGProps<SVGSVGElement>) => (
      <svg data-testid="default-filter-icon" {...props} />
    ),
  };
});

function CustomFilterIcon(props: SVGProps<SVGSVGElement>) {
  return <svg data-testid="custom-filter-icon" {...props} />;
}

function renderFilter({
  showIcon,
  icon,
  triggerLabel,
  value = '',
}: {
  showIcon?: boolean;
  icon?: typeof CustomFilterIcon;
  triggerLabel?: string;
  value?: string;
}) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NuqsTestingAdapter>
        <SearchFilterBar
          filters={[
            {
              name: 'sort',
              placeholder: 'Sort cases',
              options: [{ value: 'NAME_ASC', label: 'Name ascending' }],
              value,
              onChange: vi.fn(),
              showIcon,
              icon,
              triggerLabel,
            },
          ]}
        />
      </NuqsTestingAdapter>
    </NextIntlClientProvider>,
  );

  return screen.getByRole('combobox', { name: triggerLabel ?? 'Sort cases' });
}

describe('SearchFilterBar', () => {
  it('shows the default filter icon when enabled and no option is selected', () => {
    const trigger = renderFilter({ showIcon: true });

    expect(within(trigger).getByText('Sort cases')).toBeInTheDocument();
    expect(within(trigger).getByTestId('default-filter-icon')).toBeInTheDocument();
  });

  it('hides the filter icon by default', () => {
    const trigger = renderFilter({});

    expect(within(trigger).queryByTestId('default-filter-icon')).not.toBeInTheDocument();
  });

  it('renders a custom filter icon when provided', () => {
    const trigger = renderFilter({ showIcon: true, icon: CustomFilterIcon });

    expect(within(trigger).getByTestId('custom-filter-icon')).toBeInTheDocument();
    expect(within(trigger).queryByTestId('default-filter-icon')).not.toBeInTheDocument();
  });

  it('keeps the configured trigger label when an option is selected', () => {
    const trigger = renderFilter({ triggerLabel: 'Sort', value: 'NAME_ASC' });

    expect(within(trigger).getByText('Sort')).toBeInTheDocument();
    expect(within(trigger).queryByText('Name ascending')).not.toBeInTheDocument();
  });
});
