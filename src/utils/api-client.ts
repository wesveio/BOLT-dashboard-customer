/**
 * Centralized API client with error handling and request interceptors
 * Provides a consistent interface for making API requests
 */

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  cache?: RequestCache;
  cacheKey?: string;
  cacheTTL?: number; // in minutes
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

/**
 * Check if an error indicates an invalid or expired session
 * Matches common session error messages from API responses
 */
export function isSessionError(error: ApiError): boolean {
  if (error.status !== 401) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  const sessionErrorPatterns = [
    'invalid or expired session',
    'session expired',
    'not authenticated',
    'unauthorized',
  ];

  return sessionErrorPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * Centralized API client
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    params,
    cache = 'default',
    cacheKey,
    cacheTTL,
    headers = {},
    ...fetchOptions
  } = options;

  // Build URL with query params
  let url = endpoint;
  if (params && Object.keys(params).length > 0) {
    const queryString = buildQueryString(params);
    url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
  }

  // Set default headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: defaultHeaders,
      cache,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json().catch(() => null);
      } catch {
        errorData = null;
      }

      const error: ApiError = {
        message: errorData && typeof errorData === 'object' && 'error' in errorData
          ? String(errorData.error)
          : `Request failed with status ${response.status}`,
        status: response.status,
        data: errorData,
      };

      throw error;
    }

    // Parse response
    const data = await response.json();

    return data as T;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error && typeof error === 'object' && 'message' in error) {
      throw error;
    }

    // Wrap other errors
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      data: error,
    };

    throw apiError;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  endpoint: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

