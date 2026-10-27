import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '@/shared/components/ui/input';

/**
 * The error text is useless to a screen reader unless it is programmatically tied to the
 * field. WCAG 3.3.1 (Error Identification) and 1.3.1 (Info and Relationships): the message
 * must be reachable from the input, not merely painted next to it.
 */
describe('Input error wiring', () => {
  it('points aria-describedby at the error message it renders', () => {
    render(<Input aria-label="E-Mail" error="E-Mail ist erforderlich" />);

    const input = screen.getByLabelText('E-Mail');
    const describedBy = input.getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('E-Mail ist erforderlich');
  });

  it('announces the error to assistive technology', () => {
    render(<Input aria-label="E-Mail" error="E-Mail ist erforderlich" />);

    expect(screen.getByRole('alert')).toHaveTextContent('E-Mail ist erforderlich');
  });

  it('adds no describedby and no alert when there is no error', () => {
    render(<Input aria-label="E-Mail" />);

    expect(screen.getByLabelText('E-Mail')).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps a caller-supplied id so an external <label htmlFor> still matches', () => {
    render(
      <>
        <label htmlFor="login-email">E-Mail</label>
        <Input id="login-email" error="E-Mail ist erforderlich" />
      </>,
    );

    const input = screen.getByLabelText('E-Mail');

    expect(input).toHaveAttribute('id', 'login-email');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('preserves a caller-supplied aria-describedby alongside the error id', () => {
    render(
      <>
        <span id="hint">Mindestens 6 Zeichen</span>
        <Input aria-label="Passwort" aria-describedby="hint" error="Zu kurz" />
      </>,
    );

    const describedBy = screen.getByLabelText('Passwort').getAttribute('aria-describedby');

    expect(describedBy).toContain('hint');
    expect(describedBy?.split(' ').length).toBe(2);
  });
});
