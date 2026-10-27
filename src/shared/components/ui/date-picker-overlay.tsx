'use client';

import type { ReactElement, ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';

export type DatePickerOverlayMode = 'popover' | 'dialog';

interface DatePickerOverlayProps {
  children: ReactNode;
  contentClassName?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  overlay?: DatePickerOverlayMode;
  title: string;
  trigger: ReactElement;
}

export function DatePickerOverlay({
  children,
  contentClassName,
  onOpenChange,
  open,
  overlay = 'popover',
  title,
  trigger,
}: DatePickerOverlayProps) {
  if (overlay === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className={contentClassName}
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className={contentClassName}
        sideOffset={4}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
