export interface UserProfile {
  id: string;

  full_name: string;
  phone: string | null;
  avatar_path: string | null;

  created_at: string;
  updated_at: string;
}

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];

  total: number;
  page: number;
  pageSize: number;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface MutationResult {
  success: boolean;
  message: string;
}