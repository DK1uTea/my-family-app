import { DetailAccordionSection } from '@/shared/components/ui/detail-accordion-section'
import { DetailTextField, DetailDateField } from '@/shared/components/ui/detail-field'

export function DetailDisplaySection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Detail Display</h2>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Detail Accordion Section</p>
        <DetailAccordionSection title="Schedule Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailDateField label="Event Start" value="2026-04-05T09:00:00Z" />
            <DetailDateField label="Event End" value={undefined} />
          </div>
        </DetailAccordionSection>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Detail Text Field</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DetailTextField value="Product Partner" />
          <DetailTextField value="" />
        </div>
      </div>
    </section>
  )
}
