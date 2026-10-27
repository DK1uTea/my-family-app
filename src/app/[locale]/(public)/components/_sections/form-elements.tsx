import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Switch } from '@/shared/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group'
import { SearchIcon } from 'lucide-react'

export function FormElementsSection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Form Elements</h2>

      <div className="grid gap-8 md:grid-cols-2">

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Input</p>
          <Input placeholder="Default input" />
          <Input placeholder="Disabled" disabled />
          <Input placeholder="Invalid" aria-invalid />
          <Input type="password" placeholder="Password" />
          <InputGroup>
            <InputGroupAddon><SearchIcon /></InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
          </InputGroup>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Select</p>
          <Select>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select an option..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
              <SelectItem value="b">Option B</SelectItem>
              <SelectItem value="c">Option C</SelectItem>
            </SelectContent>
          </Select>
          <Select disabled>
            <SelectTrigger className="w-full"><SelectValue placeholder="Disabled" /></SelectTrigger>
            <SelectContent><SelectItem value="a">Option A</SelectItem></SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Textarea</p>
          <Textarea placeholder="Enter text here..." />
          <Textarea placeholder="Disabled" disabled />
          <Textarea placeholder="Invalid" aria-invalid />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">Checkbox & Switch</p>
          <div className="flex items-center gap-2"><Checkbox id="c1" /><Label htmlFor="c1">Unchecked</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="c2" defaultChecked /><Label htmlFor="c2">Checked</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="c3" disabled /><Label htmlFor="c3">Disabled</Label></div>
          <div className="flex items-center gap-2"><Switch id="s1" /><Label htmlFor="s1">Switch off</Label></div>
          <div className="flex items-center gap-2"><Switch id="s2" defaultChecked /><Label htmlFor="s2">Switch on</Label></div>
          <div className="flex items-center gap-2"><Switch id="s3" size="sm" defaultChecked /><Label htmlFor="s3">Switch sm</Label></div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Radio Group</p>
          <RadioGroup defaultValue="a">
            <div className="flex items-center gap-2"><RadioGroupItem value="a" id="r1" /><Label htmlFor="r1">Option A</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="b" id="r2" /><Label htmlFor="r2">Option B</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="c" id="r3" /><Label htmlFor="r3">Option C</Label></div>
          </RadioGroup>
        </div>

      </div>
    </section>
  )
}
