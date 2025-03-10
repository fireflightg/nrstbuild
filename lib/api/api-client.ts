import { getAuth } from "firebase/auth"

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: any
  headers?: Record<string, string>
  cache?: RequestCache
}

export async function apiClient<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const auth = getAuth()
  const user = auth.currentUser

  // Default options
  const defaultOptions: ApiOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-cache",
  }

  // Merge options
  const mergedOptions: ApiOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  // Add auth token if user is logged in
  if (user) {
    const token = await user.getIdToken()
    mergedOptions.headers = {
      ...mergedOptions.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  // Stringify body if it's an object
  if (mergedOptions.body && typeof mergedOptions.body === "object") {
    mergedOptions.body = JSON.stringify(mergedOptions.body)
  }

  // Make the request
  const response = await fetch(`/api/${endpoint}`, mergedOptions as RequestInit)

  // Handle non-JSON responses
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.indexOf("application/json") === -1) {
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    return response.text() as unknown as T
  }

  // Parse JSON response
  const data = await response.json()

  // Handle error responses
  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status} ${response.statusText}`)
  }

  return data
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<ApiOptions, "method" | "body">) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body: any, options?: Omit<ApiOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = any>(endpoint: string, body: any, options?: Omit<ApiOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T = any>(endpoint: string, body: any, options?: Omit<ApiOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T = any>(endpoint: string, options?: Omit<ApiOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
}

