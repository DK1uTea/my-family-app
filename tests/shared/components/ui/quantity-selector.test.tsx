import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { QuantitySelector } from '@/shared/components/ui/quantity-selector';

function QuantitySelectorHarness({ onSubmit }: { onSubmit: (quantity: number) => void }) {
  const [quantity, setQuantity] = useState(2);

  const handleSubmit = (nextQuantity: number) => {
    setQuantity(nextQuantity);
    onSubmit(nextQuantity);
  };

  return (
    <>
      <QuantitySelector
        value={quantity}
        min={1}
        max={10}
        onIncrease={() => setQuantity((current) => current + 1)}
        onDecrease={() => setQuantity((current) => current - 1)}
        onChange={setQuantity}
        onSubmit={handleSubmit}
        aria-label="Quantity"
      />
      <output aria-label="Committed quantity">{quantity}</output>
    </>
  );
}

describe('QuantitySelector', () => {
  it('keeps typed input as a draft until Enter commits it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuantitySelectorHarness onSubmit={onSubmit} />);

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    await user.clear(input);
    await user.type(input, '5');

    expect(input).toHaveValue(5);
    expect(screen.getByRole('status', { name: 'Committed quantity' })).toHaveTextContent('2');

    await user.keyboard('{Enter}');

    expect(screen.getByRole('status', { name: 'Committed quantity' })).toHaveTextContent('5');
    expect(onSubmit).toHaveBeenCalledWith(5);
  });

  it.each(['', '0'])('restores the committed value when Enter is pressed with %j', async (draft) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuantitySelectorHarness onSubmit={onSubmit} />);

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    await user.clear(input);
    if (draft) await user.type(input, draft);
    await user.keyboard('{Enter}');

    expect(input).toHaveValue(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
