const TOKENS = [
  { name: 'background',      bg: 'bg-background',       text: 'text-foreground',                extra: 'ring-1 ring-border' },
  { name: 'foreground',      bg: 'bg-foreground',       text: 'text-background',                extra: '' },
  { name: 'primary',         bg: 'bg-primary',          text: 'text-primary-foreground',        extra: '' },
  { name: 'primary-hover',   bg: 'bg-primary-hover',    text: 'text-primary-foreground',        extra: '' },
  { name: 'secondary',       bg: 'bg-secondary',        text: 'text-secondary-foreground',      extra: '' },
  { name: 'muted',           bg: 'bg-muted',            text: 'text-muted-foreground',          extra: '' },
  { name: 'accent',          bg: 'bg-accent',           text: 'text-accent-foreground',         extra: '' },
  { name: 'destructive',     bg: 'bg-destructive',      text: 'text-white',                     extra: '' },
  { name: 'card',            bg: 'bg-card',             text: 'text-card-foreground',           extra: 'ring-1 ring-foreground/10' },
  { name: 'border',          bg: 'bg-border',           text: 'text-foreground',                extra: '' },
  { name: 'input',           bg: 'bg-input',            text: 'text-foreground',                extra: '' },
  { name: 'sidebar',         bg: 'bg-sidebar',          text: 'text-sidebar-foreground',        extra: '' },
  { name: 'sidebar-primary', bg: 'bg-sidebar-primary',  text: 'text-sidebar-primary-foreground', extra: '' },
  { name: 'sidebar-accent',  bg: 'bg-sidebar-accent',   text: 'text-sidebar-accent-foreground', extra: '' },
  { name: 'bg-header',       bg: 'bg-background-header', text: 'text-foreground',               extra: 'ring-1 ring-border' },
  { name: 'bg-login',        bg: 'bg-background-login', text: 'text-white',                     extra: '' },
] as const

export function ColorTokensSection() {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Color Tokens</h2>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {TOKENS.map(({ name, bg, text, extra }) => (
          <div
            key={name}
            className={`flex h-14 items-center justify-center rounded-lg ${bg} ${extra}`}
          >
            <span className={`text-center font-mono text-[9px] leading-tight px-1 ${text}`}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
