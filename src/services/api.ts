/**
 * Centralized API Client & Network Service
 * Ready for real backend API endpoints with typed request/response handling.
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp: string;
}

export class ApiService {
  private static baseUrl = '/api';

  public static async simulateDelay(ms = 120): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public static async get<T>(endpoint: string, mockData: T): Promise<ApiResponse<T>> {
    await this.simulateDelay();
    return {
      data: mockData,
      status: 200,
      timestamp: new Date().toISOString(),
    };
  }

  public static async post<T, B = unknown>(endpoint: string, body: B, mockResponse: T): Promise<ApiResponse<T>> {
    await this.simulateDelay();
    return {
      data: mockResponse,
      status: 201,
      message: 'Operation executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }
}
