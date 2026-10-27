import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { PlusIcon, TrashIcon, DownloadIcon } from 'lucide-react'

export function ButtonsSection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Buttons & Badges</h2>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Variants</p>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Sizes</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Icon buttons</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="icon-xs"><PlusIcon /></Button>
          <Button size="icon-sm"><PlusIcon /></Button>
          <Button size="icon"><PlusIcon /></Button>
          <Button size="icon-lg"><PlusIcon /></Button>
          <Button variant="outline" size="icon"><TrashIcon /></Button>
          <Button variant="ghost" size="icon"><DownloadIcon /></Button>
          <Button variant="destructive" size="icon"><TrashIcon /></Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">With inline icons</p>
        <div className="flex flex-wrap gap-2">
          <Button><PlusIcon data-icon="inline-start" />Add item</Button>
          <Button variant="outline">Export<DownloadIcon data-icon="inline-end" /></Button>
          <Button variant="secondary" size="sm"><PlusIcon data-icon="inline-start" />New</Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Badges</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="ghost">Ghost</Badge>
          <Badge variant="link">Link</Badge>
        </div>
      </div>
    </section>
  )
}
