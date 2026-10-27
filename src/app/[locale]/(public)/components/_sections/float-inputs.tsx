'use client'

import { useState } from 'react'
import { InputFloat } from '@/shared/components/ui/input-float'
import { SelectFloat } from '@/shared/components/ui/select-float'
import { SelectItem } from '@/shared/components/ui/select'

export function FloatInputsSection() {
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')

  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Floating Label Inputs
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">InputFloat</p>
          <InputFloat
            label="Event title"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">SelectFloat</p>
          <SelectFloat label="Event mode" value={selectValue} onValueChange={setSelectValue}>
            <SelectItem value="face-to-face">Face to Face</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectFloat>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">States — error / disabled</p>
          <InputFloat label="Required field" value="" onChange={() => {}} error="This field is required" />
          <InputFloat label="Disabled field" value="Locked value" disabled onChange={() => {}} />
        </div>
      </div>
    </section>
  )
}
