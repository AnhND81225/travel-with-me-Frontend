import { englishApiMessage } from '../utils/englishApiMessage';
export type EventType = "TREKKING" | "CAMPING";
export type DifficultyLevel = "EASY" | "MODERATE" | "HARD";
export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type GuideStatus = "ACTIVE" | "INACTIVE";

export interface ApiEnvelope<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EventSummary {
  eventId: number;
  eventName: string;
  eventType: EventType;
  location: string | null;
  basePrice: number;
  status: EventStatus;
  difficultyLevel: DifficultyLevel | null;
  coverImageUrl: string | null;
}

export interface ApiErrorData {
  code?: string;
  fieldErrors?: Record<string, string>;
}

export interface TourActivity {
  time: string;
  title: string;
  location?: string | null;
  description?: string | null;
  icon: "meet" | "hike" | "food" | "summit" | "camp" | "rest" | "flag";
}

export interface ItineraryDay {
  day: number;
  title: string;
  summary?: string | null;
  distanceKm?: string | null;
  elevation?: string | null;
  highlights: string[];
  activities: TourActivity[];
}

export interface PackingItem {
  text: string;
  required: boolean;
}

export interface EventDetailsInput {
  itinerary?: ItineraryDay[];
  packingItems?: PackingItem[];
  durationMinutes?: number;
  difficultyLevel?: DifficultyLevel;
  meetingPoint?: string;
  requirements?: string;
}

export interface EventDetailsResponse {
  itinerary?: ItineraryDay[];
  packingItems?: PackingItem[];
  durationMinutes?: number | null;
  difficultyLevel?: DifficultyLevel | null;
  meetingPoint?: string | null;
  requirements?: string | null;
}

export interface EventInput {
  eventName: string;
  eventType: EventType;
  description?: string;
  location?: string;
  basePrice: number;
  details?: EventDetailsInput | null;
}

export interface EventImage {
  imageId: number;
  imageUrl: string;
  description: string | null;
  sortOrder: number;
  dayNumber: number | null;
  cover: boolean;
}

export interface EventResponse extends EventSummary {
  description: string | null;
  createdAt: string;
  updatedAt: string;
  details: EventDetailsResponse | null;
  images: EventImage[];
}

export interface PublicGuide {
  guideId: number;
  displayName: string;
  experienceYears: number | null;
  specialization: string | null;
  bio: string | null;
  languages: string[] | null;
  avatarUrl: string | null;
}

export interface AdminGuide extends PublicGuide {
  userId: number;
  status: GuideStatus;
}

export interface GuideRegistrationInput {
  fullName: string;
  email: string;
  phone?: string;
  experienceYears: number;
  specialization: string;
  bio?: string;
  languages?: string[];
}

export interface GuideInput {
  userId: number;
  experienceYears: number;
  specialization: string;
  bio?: string;
  languages?: string[];
}

export interface GuideRegistrationResponse {
  guide: AdminGuide;
  email: string;
  temporaryPassword: string;
  emailSent: boolean;
}

export interface GuideUpdateInput {
  experienceYears: number;
  specialization: string;
  bio?: string;
  languages?: string[];
}

export interface EventFilters {
  keyword?: string;
  eventType?: EventType;
  difficultyLevel?: DifficultyLevel;
  minPrice?: number;
  maxPrice?: number;
  status?: EventStatus;
  page?: number;
  size?: number;
}

export interface GuideFilters {
  specialization?: string;
  status?: GuideStatus;
  userId?: number;
  page?: number;
  size?: number;
}

const TOKEN_KEY = "treektour.catalog.token";

export class EventGuideApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: ApiErrorData
  ) {
    super(message);
  }
}

function query(params: object) {
  const value = new URLSearchParams();
  Object.entries(params as Record<string, string | number | undefined>).forEach(([key, item]) => {
    if (item !== undefined && item !== "") value.set(key, String(item));
  });
  const serialized = value.toString();
  return serialized ? `?${serialized}` : "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`/api${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    if (response.status === 401) sessionStorage.removeItem(TOKEN_KEY);
    const errorData = (payload?.data as unknown as ApiErrorData) || undefined;
    const detailMsg = errorData?.fieldErrors
      ? Object.entries(errorData.fieldErrors).map(([f, m]) => `${f}: ${m}`).join(", ")
      : undefined;
    const message = detailMsg
      ? `${payload?.message || "Request failed"}: ${detailMsg}`
      : (payload?.message || `Request failed (${response.status})`);
    throw new EventGuideApiError(englishApiMessage(message, response.status), response.status, errorData);
  }
  return payload!.data;
}

export const eventGuideApi = {
  listEvents: (filters: EventFilters = {}) =>
    request<PageResponse<EventSummary>>(`/events${query(filters)}`),
  getEvent: (eventId: number) => request<EventResponse>(`/events/${eventId}`),
  listGuides: (filters: Pick<GuideFilters, "specialization" | "page" | "size"> = {}) =>
    request<PageResponse<PublicGuide>>(`/guides${query(filters)}`),
  getGuide: (guideId: number) => request<PublicGuide>(`/guides/${guideId}`),

  listAdminEvents: (filters: EventFilters = {}) =>
    request<PageResponse<EventSummary>>(`/admin/events${query(filters)}`),
  getAdminEvent: (eventId: number) => request<EventResponse>(`/admin/events/${eventId}`),
  createEvent: (input: EventInput) => request<EventResponse>("/admin/events", { method: "POST", body: JSON.stringify(input) }),
  updateEvent: (eventId: number, input: EventInput) =>
    request<EventResponse>(`/admin/events/${eventId}`, { method: "PUT", body: JSON.stringify(input) }),
  setEventStatus: (eventId: number, status: EventStatus) =>
    request<EventResponse>(`/admin/events/${eventId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  uploadEventImage: (eventId: number, file: File, description?: string) => {
    const body = new FormData();
    body.append("file", file);
    return request<EventImage>(
      `/admin/events/${eventId}/images${query({ description })}`,
      { method: "POST", body },
    );
  },
  saveEventImageLayout: (eventId: number, images: { imageId: number; dayNumber: number | null }[]) =>
    request<EventImage[]>(`/admin/events/${eventId}/images/layout`, { method: "PUT", body: JSON.stringify({ images }) }),
  deleteEventImage: (eventId: number, imageId: number) =>
    request<void>(`/admin/events/${eventId}/images/${imageId}`, { method: "DELETE" }),
  updateEventImageDescription: (eventId: number, imageId: number, description: string) =>
    request<EventImage>(`/admin/events/${eventId}/images/${imageId}`, { method: "PATCH", body: JSON.stringify({ description }) }),

  listAdminGuides: (filters: GuideFilters = {}) =>
    request<PageResponse<AdminGuide>>(`/admin/guides${query(filters)}`),
  getAdminGuide: (guideId: number) => request<AdminGuide>(`/admin/guides/${guideId}`),
  createGuide: (input: GuideInput) =>
    request<AdminGuide>("/admin/guides", { method: "POST", body: JSON.stringify(input) }),
  // Creates both the GUIDE account and profile; IDs are generated server-side.
  createGuideWithAccount: (input: GuideRegistrationInput) =>
    request<GuideRegistrationResponse>("/admin/guides/with-account", { method: "POST", body: JSON.stringify(input) }),
  updateGuide: (guideId: number, input: GuideUpdateInput) =>
    request<AdminGuide>(`/admin/guides/${guideId}`, { method: "PUT", body: JSON.stringify(input) }),
  setGuideStatus: (guideId: number, status: GuideStatus) =>
    request<AdminGuide>(`/admin/guides/${guideId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  uploadGuideAvatar: (guideId: number, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<AdminGuide>(`/admin/guides/${guideId}/avatar`, { method: "PUT", body });
  },
  deleteGuideAvatar: (guideId: number) =>
    request<void>(`/admin/guides/${guideId}/avatar`, { method: "DELETE" }),
};
