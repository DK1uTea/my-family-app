'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { UnsavedChangesDialog } from '@/shared/components/common/unsaved-changes-dialog';

export function UnsavedChangesSection() {
  const [openWithSave, setOpenWithSave] = useState(false);
  const [openWithoutSave, setOpenWithoutSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndLeave = async () => {
    setIsSaving(true);
    await new Promise<void>((r) => setTimeout(r, 1200));
    setIsSaving(false);
    setOpenWithSave(false);
  };

  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Unsaved Changes Guard
      </h2>
      <div className="flex flex-wrap gap-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">With save action</p>
          <Button variant="outline" onClick={() => setOpenWithSave(true)}>
            Trigger dialog
          </Button>
          <UnsavedChangesDialog
            isOpen={openWithSave}
            isSaving={isSaving}
            hasSaveAction
            onLeave={() => setOpenWithSave(false)}
            onSaveAndLeave={handleSaveAndLeave}
            onStay={() => setOpenWithSave(false)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Without save action</p>
          <Button variant="outline" onClick={() => setOpenWithoutSave(true)}>
            Trigger dialog
          </Button>
          <UnsavedChangesDialog
            isOpen={openWithoutSave}
            isSaving={false}
            hasSaveAction={false}
            onLeave={() => setOpenWithoutSave(false)}
            onSaveAndLeave={async () => setOpenWithoutSave(false)}
            onStay={() => setOpenWithoutSave(false)}
          />
        </div>
      </div>
    </section>
  );
}
