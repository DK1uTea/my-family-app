import { SearchFilterBarSection } from './_sections/search-filter-bar'
import { TabsUrlSection } from './_sections/tabs-url'
import { MultiLevelSelectSection } from './_sections/multi-level-select'
import { FloatInputsSection } from './_sections/float-inputs'
import { ColorTokensSection } from './_sections/color-tokens'
import { ButtonsSection } from './_sections/buttons'
import { FormElementsSection } from './_sections/form-elements'
import { ComboboxSection } from './_sections/combobox'
import { EditorSection } from './_sections/editor'
import { UploadDropzoneSection } from './_sections/upload-dropzone'
import { MediaUploadSection } from './_sections/media-upload'
import { CarouselSection } from './_sections/carousel'
import { DataDisplaySection } from './_sections/data-display'
import { DetailDisplaySection } from './_sections/detail-display'
import { FeedbackSection } from './_sections/feedback'
import { OverlaysSection } from './_sections/overlays'
import { DatePickersSection } from './_sections/date-pickers'
import { UnsavedChangesSection } from './_sections/unsaved-changes'
import { ImageCropSection } from './_sections/image-crop'
import { WelcomeGreetingSection } from './_sections/welcome-greeting'

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-14">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Component Showcase</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual reference — Default theme applied to all UI components.
          </p>
        </div>
        <SearchFilterBarSection />
        <TabsUrlSection />
        <MultiLevelSelectSection />
        <FloatInputsSection />
        <ColorTokensSection />
        <ButtonsSection />
        <FormElementsSection />
        <ComboboxSection />
        <EditorSection />
        <UploadDropzoneSection />
        <MediaUploadSection />
        <CarouselSection />
        <DatePickersSection />
        <DataDisplaySection />
        <DetailDisplaySection />
        <FeedbackSection />
        <OverlaysSection />
        <UnsavedChangesSection />
        <ImageCropSection />
        <WelcomeGreetingSection />
      </div>
    </div>
  )
}
