const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface Item {
  id: string;
  receipt_id: string;
  raw_name: string;
  canonical_name: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number;
  is_pant: boolean;
  discount_amount: number;
  category: Category | null;
}

export interface Receipt {
  id: string;
  merchant_name: string;
  store_location: string | null;
  purchase_date: string;
  total_amount: number;
  currency: string;
  payment_method: string | null;
  warranty_months: number | null;
  return_window_days: number | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
  items: Item[];
}

export interface ReceiptListItem {
  id: string;
  merchant_name: string;
  store_location: string | null;
  purchase_date: string;
  total_amount: number;
  currency: string;
  item_count: number;
}

export interface Summary {
  total_receipts: number;
  total_spent: number;
  total_items: number;
  avg_receipt_amount: number;
  period_start: string | null;
  period_end: string | null;
}

export interface CategorySpending {
  category_name: string;
  category_color: string | null;
  total_spent: number;
  item_count: number;
}

export interface ByCategory {
  categories: CategorySpending[];
  uncategorized_total: number;
  uncategorized_count: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Receipts
  async getReceipts(skip = 0, limit = 50): Promise<ReceiptListItem[]> {
    return this.fetch(`/api/receipts?skip=${skip}&limit=${limit}`);
  }

  async getReceipt(id: string): Promise<Receipt> {
    return this.fetch(`/api/receipts/${id}`);
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.fetch(`/api/receipts/${id}`, { method: "DELETE" });
  }

  async uploadReceipt(file: File): Promise<Receipt> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/api/receipts/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // Analytics
  async getSummary(startDate?: string, endDate?: string): Promise<Summary> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.fetch(`/api/analytics/summary${query}`);
  }

  async getByCategory(startDate?: string, endDate?: string): Promise<ByCategory> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.fetch(`/api/analytics/by-category${query}`);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.fetch("/api/categories");
  }
}

export const api = new ApiClient(API_URL);

// Format Norwegian Krone (locale-aware)
export function formatNOK(amount: number, locale: string = "nb"): string {
  const localeCode = locale === "en" ? "en-NO" : "nb-NO";
  return new Intl.NumberFormat(localeCode, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date (locale-aware)
export function formatDate(dateString: string, locale: string = "nb"): string {
  const date = new Date(dateString);
  const localeCode = locale === "en" ? "en-GB" : "nb-NO";
  return new Intl.DateTimeFormat(localeCode, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Format relative date (requires translation function)
export function formatRelativeDate(
  dateString: string,
  translations: {
    today: string;
    yesterday: string;
    daysAgo: (days: number) => string;
  },
  locale: string = "nb"
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return translations.today;
  if (diffDays === 1) return translations.yesterday;
  if (diffDays < 7) return translations.daysAgo(diffDays);
  return formatDate(dateString, locale);
}

// Format month for grouping (locale-aware)
export function formatMonth(dateString: string, locale: string = "nb"): string {
  const date = new Date(dateString);
  const localeCode = locale === "en" ? "en-GB" : "nb-NO";
  return new Intl.DateTimeFormat(localeCode, {
    month: "long",
    year: "numeric",
  }).format(date);
}
