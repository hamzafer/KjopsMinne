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

// Recipe types
export interface RecipeIngredient {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
}

export interface Recipe {
  id: string;
  household_id: string;
  name: string;
  source_url: string | null;
  servings: number;
  prep_time_minutes: number | null;
  instructions: string;
  tags: string[];
  image_url: string | null;
  import_confidence: number | null;
  created_at: string;
  updated_at: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeListResponse {
  recipes: Recipe[];
  total: number;
}

export interface RecipeCreate {
  household_id: string;
  name: string;
  source_url?: string | null;
  servings: number;
  prep_time_minutes?: number | null;
  instructions: string;
  tags?: string[];
  image_url?: string | null;
  ingredients: Omit<RecipeIngredient, "id">[];
}

export interface RecipeImportRequest {
  url: string;
  household_id: string;
}

export interface RecipeImportResponse {
  recipe: Omit<Recipe, "id" | "created_at" | "updated_at">;
  confidence: number;
  warnings: string[];
}

// MealPlan types
export interface MealPlan {
  id: string;
  household_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  servings: number;
  status: "planned" | "cooked" | "skipped";
  is_leftover_source: boolean;
  leftover_from_id: string | null;
  cooked_at: string | null;
  actual_cost: number | null;
  cost_per_serving: number | null;
  created_at: string;
  updated_at: string;
  recipe: Recipe | null;
}

export interface MealPlanListResponse {
  meal_plans: MealPlan[];
  total: number;
}

export interface MealPlanCreate {
  household_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  servings: number;
  leftover_from_id?: string | null;
}

export interface CookRequest {
  actual_servings?: number;
  create_leftover: boolean;
  leftover_servings?: number;
}

export interface CookResponse {
  meal_plan: MealPlan;
  actual_cost: number;
  cost_per_serving: number;
  inventory_consumed: { lot_id: string; quantity: number; cost: number }[];
  leftover: Leftover | null;
}

export interface Leftover {
  id: string;
  household_id: string;
  meal_plan_id: string;
  recipe_id: string;
  remaining_servings: number;
  status: "available" | "consumed" | "discarded";
  expires_at: string;
  created_at: string;
}

export interface LeftoverListResponse {
  leftovers: Leftover[];
  total: number;
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

  // Recipes
  async getRecipes(
    householdId: string,
    search?: string,
    tags?: string[],
    page = 1,
    pageSize = 20
  ): Promise<RecipeListResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (search) params.append("search", search);
    if (tags?.length) tags.forEach((t) => params.append("tags", t));
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    return this.fetch(`/api/recipes?${params.toString()}`);
  }

  async getRecipe(id: string): Promise<Recipe> {
    return this.fetch(`/api/recipes/${id}`);
  }

  async createRecipe(data: RecipeCreate): Promise<Recipe> {
    return this.fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(id: string, data: Partial<RecipeCreate>): Promise<Recipe> {
    return this.fetch(`/api/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.fetch(`/api/recipes/${id}`, { method: "DELETE" });
  }

  async importRecipe(data: RecipeImportRequest): Promise<RecipeImportResponse> {
    return this.fetch("/api/recipes/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  // Meal Plans
  async getMealPlans(
    householdId: string,
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<MealPlanListResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (status) params.append("status", status);
    return this.fetch(`/api/meal-plans?${params.toString()}`);
  }

  async getMealPlan(id: string): Promise<MealPlan> {
    return this.fetch(`/api/meal-plans/${id}`);
  }

  async createMealPlan(data: MealPlanCreate): Promise<MealPlan> {
    return this.fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateMealPlan(
    id: string,
    data: Partial<MealPlanCreate> & { status?: string }
  ): Promise<MealPlan> {
    return this.fetch(`/api/meal-plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteMealPlan(id: string): Promise<void> {
    await this.fetch(`/api/meal-plans/${id}`, { method: "DELETE" });
  }

  async cookMealPlan(id: string, data: CookRequest): Promise<CookResponse> {
    return this.fetch(`/api/meal-plans/${id}/cook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  // Leftovers
  async getLeftovers(
    householdId: string,
    status?: string
  ): Promise<LeftoverListResponse> {
    const params = new URLSearchParams();
    params.append("household_id", householdId);
    if (status) params.append("status", status);
    return this.fetch(`/api/leftovers?${params.toString()}`);
  }

  async updateLeftover(
    id: string,
    data: { status?: string; remaining_servings?: number }
  ): Promise<Leftover> {
    return this.fetch(`/api/leftovers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
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
