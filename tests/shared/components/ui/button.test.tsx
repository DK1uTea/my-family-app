import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/shared/components/ui/button';

describe('Button', () => {
  it('renders a native button with its children by default', () => {
    render(<Button>Speichern</Button>);

    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
  });

  it('disables itself and hides the label while loading', () => {
    render(<Button isLoading>Speichern</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.queryByText('Speichern')).not.toBeInTheDocument();
  });

  it('stays disabled when the disabled prop is set', () => {
    render(<Button disabled>Speichern</Button>);

    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('keeps the slotted element intact and only swaps its inner content while loading (asChild)', () => {
    render(
      <Button asChild isLoading>
        <a href="/somewhere">Weiter</a>
      </Button>,
    );

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/somewhere');
    expect(link).toHaveAttribute('disabled');
    expect(screen.queryByText('Weiter')).not.toBeInTheDocument();
  });

  it('exposes variant and size as data attributes for styling assertions', () => {
    render(
      <Button variant="destructive" size="sm">
        Löschen
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Löschen' });

    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'sm');
  });
});
