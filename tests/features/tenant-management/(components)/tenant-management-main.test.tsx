import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/messages/en.json'
import { TenantManagementMain } from '@/features/tenant-management/(components)/tenant-management-main'

const mocks = vi.hoisted(() => ({
  query: { search: '', page: 1, limit: 10, sort: 'createdAt:desc' },
  setQuery: vi.fn(),
  setSearch: vi.fn(),
  onSearch: vi.fn(),
  onPageChange: vi.fn(),
  onLimitChange: vi.fn(),
  onSortChange: vi.fn(),
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
  activateMutate: vi.fn(),
  deactivateMutate: vi.fn(),
}))

const tenant = {
  id: 'north',
  name: 'North Family',
  description: 'A northern family workspace',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

vi.mock('nuqs', () => ({
  parseAsString: { withDefault: () => ({}) },
  useQueryStates: () => [mocks.query, mocks.setQuery],
  useQueryState: () => ['', mocks.setSearch],
}))
vi.mock('@/features/tenant-management/(hooks)/use-tenants-filter', () => ({
  useTenantsFilter: () => ({
    query: mocks.query,
    sortFilter: {
      name: 'sort',
      label: 'Sort tenants',
      value: mocks.query.sort,
      onChange: mocks.onSortChange,
      options: [
        { value: 'createdAt:desc', label: 'Newest' },
        { value: 'createdAt:asc', label: 'Oldest' },
      ],
    },
    onSearch: mocks.onSearch,
    onPageChange: mocks.onPageChange,
    onLimitChange: mocks.onLimitChange,
  }),
}))
vi.mock('@/features/tenant-management/(hooks)/use-tenants', () => ({
  useTenants: () => ({
    data: {
      items: [tenant],
      pagination: {
        total: 1,
        limit: 10,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
    isLoading: false,
    isError: false,
  }),
}))
vi.mock('@/features/tenant-management/(hooks)/use-create-tenant', () => ({
  useCreateTenant: () => ({ isPending: false, mutate: mocks.createMutate }),
}))
vi.mock('@/features/tenant-management/(hooks)/use-update-tenant', () => ({
  useUpdateTenant: () => ({ isPending: false, mutate: mocks.updateMutate }),
}))
vi.mock('@/features/tenant-management/(hooks)/use-activate-tenant', () => ({
  useActivateTenant: () => ({ isPending: false, mutate: mocks.activateMutate }),
}))
vi.mock('@/features/tenant-management/(hooks)/use-deactivate-tenant', () => ({
  useDeactivateTenant: () => ({ isPending: false, mutate: mocks.deactivateMutate }),
}))

function renderMain() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TenantManagementMain />
    </NextIntlClientProvider>,
  )
}

describe('TenantManagementMain', () => {
  beforeEach(() => {
    mocks.query = { search: '', page: 1, limit: 10, sort: 'createdAt:desc' }
    vi.clearAllMocks()
  })

  it('renders tenant details and resets pagination after committed search', async () => {
    const user = userEvent.setup()
    renderMain()

    expect(screen.getByTestId('tenant-row-north')).toBeInTheDocument()
    expect(screen.getByText(tenant.description)).toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: 'Search tenants' }),
      'north{Enter}',
    )

    expect(mocks.onSearch).toHaveBeenCalledWith('north')
  })

  it('uses the selected sort option from the filter bar', async () => {
    const user = userEvent.setup()
    renderMain()

    await user.click(screen.getByRole('combobox', { name: 'Sort tenants' }))
    await user.click(screen.getByRole('option', { name: 'Oldest' }))

    expect(mocks.onSortChange).toHaveBeenCalledWith('createdAt:asc')
  })

  it('creates a tenant with a trimmed optional description', async () => {
    const user = userEvent.setup()
    renderMain()
    await user.click(screen.getByTestId('tenant-add-button'))
    expect(screen.queryByTestId('tenant-id-input')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter a tenant name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe this tenant (optional)')).toBeInTheDocument()
    await user.type(screen.getByTestId('tenant-name-input'), '  New Family  ')
    await user.type(
      screen.getByTestId('tenant-description-input'),
      '  Shared family space  ',
    )
    await user.click(screen.getByTestId('tenant-submit-button'))

    await waitFor(() =>
      expect(mocks.createMutate).toHaveBeenCalledWith(
        {
          name: 'New Family',
          description: 'Shared family space',
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    )
  })

  it('prefills and updates a tenant description when editing', async () => {
    const user = userEvent.setup()
    renderMain()

    await user.click(screen.getByRole('button', { name: 'Actions for North Family' }))
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))

    const description = screen.getByTestId('tenant-description-input')
    expect(description).toHaveValue(tenant.description)
    await user.clear(description)
    await user.type(description, 'Updated workspace description')
    await user.click(screen.getByTestId('tenant-submit-button'))

    await waitFor(() =>
      expect(mocks.updateMutate).toHaveBeenCalledWith(
        {
          id: tenant.id,
          name: tenant.name,
          description: 'Updated workspace description',
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    )
  })

  it('requires a tenant name before calling create', async () => {
    const user = userEvent.setup()
    renderMain()
    await user.click(screen.getByTestId('tenant-add-button'))
    await user.click(screen.getByTestId('tenant-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Tenant name is required.')
    expect(mocks.createMutate).not.toHaveBeenCalled()
  })

  it('rejects descriptions longer than the tenant description limit', async () => {
    const user = userEvent.setup()
    renderMain()
    await user.click(screen.getByTestId('tenant-add-button'))
    await user.type(screen.getByTestId('tenant-name-input'), 'New Family')
    fireEvent.change(screen.getByTestId('tenant-description-input'), {
      target: { value: 'x'.repeat(501) },
    })
    await user.click(screen.getByTestId('tenant-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Description must be 500 characters or fewer.',
    )
    expect(mocks.createMutate).not.toHaveBeenCalled()
  })
})
