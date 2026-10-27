'use client';

import { useEffect, useRef, useState } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onChange?: (value: number) => void;
  onSubmit?: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
  className?: string;
  id?: string;
  invalid?: boolean;
  errorId?: string;
  'aria-label'?: string;
};

export function QuantitySelector({
  value,
  min = 1,
  max = Infinity,
  onIncrease,
  onDecrease,
  onChange,
  onSubmit,
  onBlur,
  disabled,
  size = 'default',
  className,
  id,
  invalid,
  errorId,
  'aria-label': ariaLabel,
}: Props) {
  const isSm = size === 'sm';
  const [draftValue, setDraftValue] = useState(value.toString());
  // Tracks the last known-good value so a blur that follows an Enter commit
  // (some browsers blur a number input on Enter) restores to what was just
  // committed instead of the stale `value` prop — `onChange`/`onSubmit`
  // update the parent asynchronously, so `value` itself hasn't caught up yet
  // by the time that blur fires in the same tick.
  const committedRef = useRef(value);

  useEffect(() => {
    committedRef.current = value;
    setDraftValue(value.toString());
  }, [value]);

  const restoreCommittedValue = () => {
    setDraftValue(committedRef.current.toString());
  };

  const commitDraftValue = () => {
    const parsed = Number(draftValue);
    if (
      draftValue.trim() === '' ||
      !Number.isInteger(parsed) ||
      parsed < min ||
      parsed > max
    ) {
      restoreCommittedValue();
      return;
    }

    committedRef.current = parsed;
    setDraftValue(parsed.toString());

    if (onSubmit) {
      onSubmit(parsed);
      return;
    }

    onChange?.(parsed);
  };

  return (
    <div className={cn('flex items-center gap-1 rounded-xl bg-background p-1', className)}>
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= min || disabled}
        className={cn(
          'flex items-center justify-center rounded-lg text-primary transition-opacity',
          isSm ? 'size-4' : 'size-7',
          (value <= min || disabled) && 'cursor-not-allowed opacity-40',
        )}
      >
        <MinusIcon className={isSm ? 'size-4' : 'size-5'} />
      </button>

      {onChange || onSubmit ? (
        <input
          translate="no"
          type="number"
          id={id}
          value={draftValue}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-label={ariaLabel}
          onChange={(e) => {
            const str = e.target.value;
            if (str === '') {
              setDraftValue('');
              return;
            }
            const draft = Number(str);
            if (Number.isInteger(draft) && draft >= 0 && draft <= max) {
              setDraftValue(str);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDraftValue();
            }
          }}
          onBlur={() => {
            commitDraftValue();
            onBlur?.();
          }}
          className={cn(
            'bg-transparent text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            isSm ? 'h-6 w-10 text-sm' : 'h-8 w-12 text-base',
          )}
        />
      ) : (
        <span className={cn('flex items-center justify-center font-semibold', isSm ? 'h-6 w-8 text-sm' : 'h-8 w-10 text-base')}>
          {value}
        </span>
      )}

      <button
        type="button"
        onClick={onIncrease}
        disabled={value >= max || disabled}
        className={cn(
          'flex items-center justify-center rounded-lg text-primary transition-opacity',
          isSm ? 'size-4' : 'size-7',
          (value >= max || disabled) && 'cursor-not-allowed opacity-40',
        )}
      >
        <PlusIcon className={isSm ? 'size-4' : 'size-5'} />
      </button>
    </div>
  );
}
