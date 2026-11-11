import "server-only";
import type { TenantSort } from "@/shared/types/tenant-sort";

export type TenantRecord = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantListQuery = {
  search: string;
  page: number;
  limit: number;
  sort: TenantSort;
};

export type TenantPage = {
  items: TenantRecord[];
  total: number;
  page: number;
  limit: number;
};
