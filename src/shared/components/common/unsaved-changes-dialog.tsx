'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import type { UnsavedChangesDialogProps } from '@/shared/hooks/common/use-unsaved-changes';

export function UnsavedChangesDialog({
  isOpen,
  isSaving,
  hasSaveAction,
  onLeave,
  onSaveAndLeave,
  onStay,
  description,
}: UnsavedChangesDialogProps) {
  const t = useTranslations('common.unsavedChanges');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onStay(); }}>
      <DialogContent showCloseButton={false} className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{description ?? t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-wrap justify-end">
          <Button variant="outline-primary" onClick={onLeave} disabled={isSaving}>
            {t('leaveWithoutSaving')}
          </Button>
          <Button variant="outline-primary" onClick={onStay} disabled={isSaving}>
            {t('stay')}
          </Button>
          {hasSaveAction && (
            <Button onClick={() => { void onSaveAndLeave(); }} disabled={isSaving}>
              {isSaving ? t('saving') : t('saveAndLeave')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
