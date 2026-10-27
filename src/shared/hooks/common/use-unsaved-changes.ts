'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigationGuard } from './use-navigation-guard';

export type UnsavedChangesDialogProps = {
  isOpen: boolean;
  isSaving: boolean;
  hasSaveAction: boolean;
  onLeave: () => void;
  onSaveAndLeave: () => Promise<void>;
  onStay: () => void;
  description?: string;
};

type Options = {
  isDirty: boolean;
  /** Restores the form to its last persisted baseline before navigation. */
  onDiscard: () => void;
  /**
   * Called when "Save and leave" is clicked.
   * Return `false` to signal validation failed — dialog closes, form shows inline errors.
   * Return `true` or `void` to signal success — navigation proceeds.
   */
  onSave?: () => Promise<boolean | void> | boolean | void;
};

export function useUnsavedChanges({ isDirty, onDiscard, onSave }: Options): {
  dialogProps: UnsavedChangesDialogProps;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isDirty && bypassed) {
      setBypassed(false);
    }
  }, [bypassed, isDirty]);

  useNavigationGuard(isDirty && !bypassed, (proceed) => {
    pendingNavRef.current = proceed;
    setIsOpen(true);
  });

  const handleLeave = () => {
    const nav = pendingNavRef.current;
    pendingNavRef.current = null;
    // The replayed anchor click is intercepted again while `isDirty` remains
    // true, so remove this guard synchronously before replaying navigation.
    flushSync(() => {
      onDiscard();
      setIsOpen(false);
      setBypassed(true);
    });
    nav?.();
  };

  const handleSaveAndLeave = async () => {
    if (!onSave) {
      handleLeave();
      return;
    }
    setIsSaving(true);
    try {
      const result = await onSave();
      if (result === false) {
        // Validation failed — close dialog, form shows inline errors
        setIsOpen(false);
        pendingNavRef.current = null;
      } else {
        handleLeave();
      }
    } catch {
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStay = () => {
    pendingNavRef.current = null;
    setIsOpen(false);
  };

  return {
    dialogProps: {
      isOpen,
      isSaving,
      hasSaveAction: !!onSave,
      onLeave: handleLeave,
      onSaveAndLeave: handleSaveAndLeave,
      onStay: handleStay,
    },
  };
}
