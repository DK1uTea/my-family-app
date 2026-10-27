'use client'

import { useState } from 'react'
import { MultiLevelSelect } from '@/shared/components/ui/multi-level-select'

const SAMPLE_OPTIONS = [
  { id: '1', name: 'Electronics', slug: 'electronics', parent_id: null },
  { id: '2', name: 'Computers', slug: 'computers', parent_id: '1' },
  { id: '3', name: 'Laptops', slug: 'laptops', parent_id: '2' },
  { id: '4', name: 'Desktops', slug: 'desktops', parent_id: '2' },
  { id: '5', name: 'Phones', slug: 'phones', parent_id: '1' },
  { id: '6', name: 'Smartphones', slug: 'smartphones', parent_id: '5' },
  { id: '7', name: 'Feature Phones', slug: 'feature-phones', parent_id: '5' },
  { id: '8', name: 'Clothing', slug: 'clothing', parent_id: null },
  { id: '9', name: 'Men', slug: 'men-clothing', parent_id: '8' },
  { id: '10', name: 'Women', slug: 'women-clothing', parent_id: '8' },
  { id: '11', name: 'Food & Beverages', slug: 'food', parent_id: null },
]

export function MultiLevelSelectSection() {
  const [value, setValue] = useState('')

  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Multi Level Select
      </h2>

      <div className="flex flex-wrap gap-8">
        <div className="w-72 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Default</p>
          <MultiLevelSelect
            label="Category"
            value={value}
            options={SAMPLE_OPTIONS}
            onChangeAction={setValue}
          />
          {value && (
            <p className="text-xs text-muted-foreground">Selected: {value}</p>
          )}
        </div>

        <div className="w-72 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Disabled (no options)</p>
          <MultiLevelSelect
            label="Empty list"
            value=""
            options={[]}
            onChangeAction={() => {}}
          />
        </div>
      </div>
    </section>
  )
}
