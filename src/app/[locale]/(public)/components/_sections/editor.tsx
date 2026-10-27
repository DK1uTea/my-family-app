'use client'

import { useState } from 'react'

import { Editor } from '@/shared/components/ui/editor'

export function EditorSection() {
  const [value, setValue] = useState('')

  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Rich Text Editor
      </h2>
      <p className="text-sm text-muted-foreground">
        Tiptap-powered editor with bold, italic, underline, strikethrough and text alignment.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Default</p>
          <Editor value={value} onChange={setValue} placeholder="Start typing..." />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Disabled</p>
          <Editor value="<p>This content is <strong>read-only</strong>.</p>" disabled />
        </div>
      </div>

      {value && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">HTML output</p>
          <pre className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap break-all">
            {value}
          </pre>
        </div>
      )}
    </section>
  )
}
