import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/messages/en.json';
import { OptionMenu } from '@/shared/components/ui/option-menu';

vi.mock('lucide-react', () => ({
  EllipsisVertical: () => <svg role="img" aria-label="Vertical ellipsis" />,
}));

function renderOptionMenu(triggerIcon?: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <OptionMenu
        items={[{ key: 'edit', label: 'Edit' }]}
        triggerIcon={triggerIcon}
      />
    </NextIntlClientProvider>,
  );
}

describe('OptionMenu', () => {
  it('uses the vertical ellipsis icon by default', () => {
    renderOptionMenu();

    expect(screen.getByRole('img', { name: 'Vertical ellipsis' })).toBeInTheDocument();
  });

  it('renders a custom trigger icon when provided', () => {
    renderOptionMenu(<svg role="img" aria-label="Horizontal ellipsis" />);

    expect(screen.getByRole('img', { name: 'Horizontal ellipsis' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Vertical ellipsis' })).not.toBeInTheDocument();
  });
});
