import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tenantsService } from "@/server/modules/tenants";
import { apiError } from "@/app/api/_shared/error-response";
import { TENANT_SORT_OPTIONS } from "@/shared/types/tenant-sort";

type TenantContext = { params: Promise<{ id: string }> };

const tenantNameSchema = z.string().trim().min(1).max(150);
const tenantDescriptionSchema = z.string().trim().max(500).nullable().optional();
const createSchema = z.object({
  name: tenantNameSchema,
  description: tenantDescriptionSchema,
}).strict();
const updateSchema = z.object({
  name: tenantNameSchema,
  description: tenantDescriptionSchema,
}).strict();

function parsePage(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export const tenantsController = {
  async list(req: NextRequest): Promise<Response> {
    const search = (req.nextUrl.searchParams.get("search") ?? "").trim();
    if (search.length > 150) return apiError(400, "TENANT_SEARCH_TOO_LONG");
    const page = parsePage(req.nextUrl.searchParams.get("page"), 1);
    const limit = parsePage(req.nextUrl.searchParams.get("limit"), 10);
    if (page === null || limit === null || limit > 100) return apiError(400, "TENANT_PAGINATION_INVALID");
    const requestedSortValue = req.nextUrl.searchParams.get("sort") ?? TENANT_SORT_OPTIONS[0];
    const requestedSort = TENANT_SORT_OPTIONS.find((sort) => sort === requestedSortValue);
    if (!requestedSort) {
      return apiError(400, "TENANT_SORT_INVALID");
    }

    const result = await tenantsService.list({
      search,
      page,
      limit,
      sort: requestedSort,
    });
    const totalPages = Math.ceil(result.total / result.limit);
    return NextResponse.json({
      status: 200,
      message: "OK",
      data: {
        items: result.items,
        pagination: {
          total: result.total,
          limit: result.limit,
          page: result.page,
          totalPages,
          hasNextPage: result.page < totalPages,
          hasPrevPage: result.page > 1,
        },
      },
    });
  },

  async create(req: NextRequest): Promise<Response> {
    const payload = createSchema.safeParse(await req.json().catch(() => null));
    if (!payload.success) return apiError(400, "TENANT_INVALID");
    const tenant = await tenantsService.create({
      name: payload.data.name,
      description: payload.data.description || null,
    });
    if (!tenant) return apiError(409, "TENANT_ID_EXISTS");
    return NextResponse.json({ status: 201, message: "Created", data: { tenant } }, { status: 201 });
  },

  async update(req: NextRequest, _actorId: string, context: TenantContext): Promise<Response> {
    const payload = updateSchema.safeParse(await req.json().catch(() => null));
    if (!payload.success) return apiError(400, "TENANT_INVALID");
    const { id } = await context.params;
    const tenant = await tenantsService.update(id, {
      name: payload.data.name,
      ...(payload.data.description === undefined
        ? {}
        : { description: payload.data.description || null }),
    });
    if (!tenant) return apiError(404, "TENANT_NOT_FOUND");
    return NextResponse.json({ status: 200, message: "OK", data: { tenant } });
  },

  async activate(_req: NextRequest, _actorId: string, context: TenantContext): Promise<Response> {
    const { id } = await context.params;
    const tenant = await tenantsService.activate(id);
    if (!tenant) return apiError(404, "TENANT_NOT_FOUND");
    return NextResponse.json({ status: 200, message: "OK", data: { tenant } });
  },

  async deactivate(_req: NextRequest, _actorId: string, context: TenantContext): Promise<Response> {
    const { id } = await context.params;
    const tenant = await tenantsService.deactivate(id);
    if (!tenant) return apiError(404, "TENANT_NOT_FOUND");
    return NextResponse.json({ status: 200, message: "OK", data: { tenant } });
  },
};
