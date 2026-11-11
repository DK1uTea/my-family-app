import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/messages/vi.json';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

import { ErrorPage } from '@/shared/components/common/error-page';

describe('ErrorPage', () => {
  it('renders localized copy for a known API error key', () => {
    window.history.replaceState({}, '', '/vi/tenant-management');
    const error = Object.assign(new Error('TENANT_NOT_FOUND'), {
      response: { data: { error_code: 'TENANT_NOT_FOUND' } },
    });

    render(<ErrorPage error={error} />);

    expect(screen.getByText(messages.errors.TENANT_NOT_FOUND)).toBeInTheDocument();
    expect(screen.queryByText('TENANT_NOT_FOUND')).not.toBeInTheDocument();
  });
});
