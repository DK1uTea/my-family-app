'use client'

import type { ComponentProps } from 'react'
import { useTranslations } from 'next-intl'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { getPaginationRange } from '@/shared/components/ui/pagination-range'

type PaginationProps = Omit<ComponentProps<'nav'>, 'children'> & {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  variant?: 'numbered' | 'compact'
  disabled?: boolean
}

function Pagination({
  className,
  currentPage,
  totalPages,
  onPageChange,
  variant = 'numbered',
  disabled = false,
  ...props
}: PaginationProps) {
  const t = useTranslations('common.pagination')

  if (totalPages <= 1) return null

  const page = Math.min(Math.max(currentPage, 1), totalPages)
  const isFirstPage = page === 1
  const isLastPage = page === totalPages

  if (variant === 'compact') {
    return (
      <nav
        aria-label={t('label')}
        aria-busy={disabled || undefined}
        data-slot="pagination"
        className={cn('flex items-center justify-center gap-2', className)}
        {...props}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('rounded-full', !disabled && !isFirstPage && 'text-primary')}
          aria-label={t('previous')}
          disabled={disabled || isFirstPage}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
        </Button>
        <span className="flex items-center gap-1 text-sm whitespace-nowrap" translate="no">
          <span
            aria-current="page"
            aria-label={t('currentPage', { page })}
            className="flex size-8 items-center justify-center rounded-button border border-border"
          >
            {page}
          </span>
          {t('of')} {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('rounded-full', !disabled && !isLastPage && 'text-primary')}
          aria-label={t('next')}
          disabled={disabled || isLastPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </nav>
    )
  }

  const range = getPaginationRange(page, totalPages)

  return (
    <nav
      aria-label={t('label')}
      aria-busy={disabled || undefined}
      data-slot="pagination"
      className={cn(
        'mx-auto flex w-full justify-center overflow-x-auto overflow-y-hidden py-1',
        className,
      )}
      {...props}
    >
      <ul className="flex min-w-max items-center gap-1" data-slot="pagination-content">
        <li>
          <Button
            type="button"
            variant="light-gray"
            size="icon-xl"
            aria-label={t('first')}
            disabled={disabled || isFirstPage}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeftIcon aria-hidden="true" data-icon="inline-start" />
          </Button>
        </li>
        <li>
          <Button
            type="button"
            variant="light-gray"
            size="icon-xl"
            aria-label={t('previous')}
            disabled={disabled || isFirstPage}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
          </Button>
        </li>
        {range.map((item) => (
          <li key={item}>
            {typeof item === 'number' ? (
              <Button
                type="button"
                variant={item === page ? 'default' : 'light-gray'}
                size="icon-xl"
                aria-current={item === page ? 'page' : undefined}
                disabled={disabled}
                aria-label={
                  item === page ? t('currentPage', { page: item }) : t('goToPage', { page: item })
                }
                onClick={() => item !== page && onPageChange(item)}
              >
                {item}
              </Button>
            ) : (
              <span
                aria-label={t('morePages')}
                className="flex size-10 items-center justify-center"
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </span>
            )}
          </li>
        ))}
        <li>
          <Button
            type="button"
            variant="light-gray"
            size="icon-xl"
            aria-label={t('next')}
            disabled={disabled || isLastPage}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
          </Button>
        </li>
        <li>
          <Button
            type="button"
            variant="light-gray"
            size="icon-xl"
            aria-label={t('last')}
            disabled={disabled || isLastPage}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRightIcon aria-hidden="true" data-icon="inline-end" />
          </Button>
        </li>
      </ul>
    </nav>
  )
}

export { Pagination }
export type { PaginationProps }
