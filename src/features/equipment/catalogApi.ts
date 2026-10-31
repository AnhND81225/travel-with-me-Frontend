import { englishApiMessage } from '../../utils/englishApiMessage';
export type Product = {
  id: number;
  name: string;
  category: string | null;
  salePrice: number | null;
  rentalPricePerDay: number | null;
  status: string;
};
export type Page<T> = {
  content: T[];
  page: number;
  totalPages: number;
  totalElements: number;
};
export type Branch = {
  id: number;
  name: string;
  status: string;
  phone?: string | null;
  address?: string | null;
};
export type Stock = {
  id: number;
  productId: number;
  productName: string;
  quantityTotal: number;
  quantityAvailable: number;
  quantityRented: number;
  status: string;
};
export type Account = {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
};
const key = "treektour.catalog.token";
export function saveToken(value: string | null) {
  if (value) sessionStorage.setItem(key, value);
  else sessionStorage.removeItem(key);
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function catalogApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = sessionStorage.getItem(key);
  const response = await fetch("/api" + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) saveToken(null);
    throw new ApiError(
      englishApiMessage(payload?.message || `Unable to complete request (${response.status})`, response.status),
      response.status,
    );
  }
  return payload.data as T;
}
export async function allProducts(admin: boolean) {
  const products: Product[] = [];
  let index = 0,
    result: Page<Product>;
  do {
    result = await catalogApi<Page<Product>>(
      `${admin ? "/admin" : ""}/products?page=${index++}&size=100`,
    );
    products.push(...result.content);
  } while (index < result.totalPages);
  return products;
}
export const vnd = (value: number | null) =>
  value === null
    ? "N/A"
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value);
