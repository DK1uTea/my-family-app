import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/components/ui/carousel'

const SLIDE_COUNT = 6

export function CarouselSection() {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Carousel
      </h2>
      <p className="text-sm text-muted-foreground">
        Embla-powered carousel with previous/next navigation. Use <code>basis-*</code> on{' '}
        <code>CarouselItem</code> to control how many slides are visible.
      </p>

      <div className="space-y-6">
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">1-per-view</p>
          <div className="px-14">
            <Carousel>
              <CarouselContent>
                {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                  <CarouselItem key={i}>
                    <div className="flex h-28 items-center justify-center rounded-lg border border-border bg-card">
                      <span className="text-sm font-medium text-muted-foreground">Slide {i + 1}</span>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">3-per-view</p>
          <div className="px-14">
            <Carousel opts={{ align: 'start' }}>
              <CarouselContent>
                {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                  <CarouselItem key={i} className="basis-1/3">
                    <div className="flex h-28 items-center justify-center rounded-lg border border-border bg-card">
                      <span className="text-sm font-medium text-muted-foreground">Slide {i + 1}</span>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  )
}
