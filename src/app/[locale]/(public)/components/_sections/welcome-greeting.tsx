'use client';

import { WelcomeGreeting } from '@/shared/components/common/welcome-greeting';

export function WelcomeGreetingSection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Welcome Greeting
      </h2>
      <div className="flex flex-wrap gap-10">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">With name and last login</p>
          <WelcomeGreeting
            firstName="Jane"
            lastName="Doe"
            lastLogin="2026-08-28T07:30:00.000Z"
            dateFormat="DD/MM/YYYY"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Without name (generic welcome)</p>
          <WelcomeGreeting lastLogin={null} dateFormat="DD/MM/YYYY" />
        </div>
      </div>
    </section>
  );
}
