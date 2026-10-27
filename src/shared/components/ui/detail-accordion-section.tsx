'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/shared/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';

type Props = {
  title: string;
  className?: string;
  children: React.ReactNode;
};

export function DetailAccordionSection({ title, className, children }: Props) {
  return (
    <Card className="py-0">
      <Accordion type="single" collapsible defaultValue="open">
        <AccordionItem value="open" className="border-none">
          <AccordionTrigger className="px-6 py-4 hover:no-underline font-semibold text-lg">
            {title}
          </AccordionTrigger>
          <AccordionContent className={cn('px-6 pb-5 h-auto!', className)}>
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
