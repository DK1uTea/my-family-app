'use client'

import { Skeleton } from '@/shared/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/shared/components/ui/empty'
import { Pagination } from '@/shared/components/ui/pagination'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/shared/components/ui/accordion'
import { Button } from '@/shared/components/ui/button'
import { InboxIcon } from 'lucide-react'

export function FeedbackSection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Feedback & Navigation</h2>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Skeleton</p>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Empty state</p>
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia ><InboxIcon /></EmptyMedia>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>Try adjusting your search or filter to find what you&apos;re looking for.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">Clear filters</Button>
          </EmptyContent>
        </Empty>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Pagination</p>
        <div className="flex flex-col items-center gap-4">
          <Pagination currentPage={1} totalPages={68} onPageChange={() => undefined} />
          <Pagination
            currentPage={2}
            totalPages={68}
            variant="compact"
            onPageChange={() => undefined}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Accordion</p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is this application?</AccordionTrigger>
            <AccordionContent>A multi-tenant modern dashboard platform built with Next.js 16, React 19, and Tailwind CSS v4.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How does tenant theming work?</AccordionTrigger>
            <AccordionContent>Each tenant gets a CSS class or token set that overrides semantic theme variables.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Is dark mode supported?</AccordionTrigger>
            <AccordionContent>Yes — toggle the .dark class on the html element. All color tokens adapt automatically.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </section>
  )
}
