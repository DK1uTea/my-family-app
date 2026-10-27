import { cn } from '@/lib/utils';

type Props = {
  size?: 'sm' | 'md';
  label?: string;
};

export function NewBadge({ size = 'md', label = 'New' }: Props) {
  const isSm = size === 'sm';

  return (
    <div
      className={cn(
        'pointer-events-none absolute -top-1 -left-1 z-10 overflow-hidden rounded-tl-[18px]',
        isSm ? 'size-16' : 'size-24',
      )}
    >
      <div
        className={cn(
          'absolute bg-[#E83B3B] text-center uppercase tracking-wide text-white -rotate-45 [box-shadow:0_3px_8px_rgba(185,28,28,0.45),0_1px_3px_rgba(0,0,0,0.25)]',
          isSm
            ? 'top-3 -left-[18px] w-20 py-0.5 text-[9px]'
            : 'top-[18px] -left-[22px] w-[110px] py-1 text-xs',
        )}
      >
        {label}
      </div>
    </div>
  );
}
