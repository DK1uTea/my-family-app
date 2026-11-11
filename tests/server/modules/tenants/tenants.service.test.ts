import { describe, expect, it, vi } from 'vitest'
import { TenantsService } from '@/server/modules/tenants/tenants.service'
import type { TenantRecord, TenantsRepository } from '@/server/layer-data/tenants'

vi.mock('server-only', () => ({}))
vi.mock('@/server/layer-data/tenants', () => ({ tenantsRepository: {} }))

describe('TenantsService.create', () => {
  it('generates a slugged UUID tenant ID on the server', async () => {
    const create = vi.fn(async (payload: Pick<TenantRecord, 'id' | 'name' | 'description'>) => ({
      ...payload,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }))
    const repository = { create } as unknown as TenantsRepository
    const service = new TenantsService(repository)

    const tenant = await service.create({ name: 'North Family', description: null })

    if (!tenant) throw new Error('Expected the tenant repository to create a tenant')

    expect(tenant.id).toMatch(
      /^north-family-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/,
    )
    expect(tenant.id).toHaveLength(49)
    expect(create).toHaveBeenCalledWith({
      id: tenant.id,
      name: 'North Family',
      description: null,
    })
  })
})
