import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SearchInput } from '@/shared/components/common/search-input';

const { setKeyword } = vi.hoisted(() => ({ setKeyword: vi.fn() }));

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('nuqs', () => ({
  parseAsString: { withDefault: () => ({}) },
  useQueryState: () => ['', setKeyword],
}));

describe('SearchInput', () => {
  it('notifies the consumer when Enter commits a search', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchInput placeholder="Search products" onSearchAction={onSearch} />);

    await user.type(screen.getByRole('textbox', { name: 'Search products' }), '  cola  {Enter}');

    expect(setKeyword).toHaveBeenCalledWith('cola');
    expect(onSearch).toHaveBeenCalledWith('cola');
  });
});
