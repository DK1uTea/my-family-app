import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

describe('SelectContent', () => {
  it('opens with left-aligned popper positioning by default', () => {
    render(
      <Select defaultValue="first">
        <SelectTrigger aria-label="Example option">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="first">First</SelectItem>
            <SelectItem value="second">Second</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Example option' }));

    expect(document.querySelector('[data-position]')).toHaveAttribute('data-position', 'popper');
    expect(screen.getByRole('listbox')).toHaveAttribute('data-align', 'start');
  });
});
