"use client"

import { useState, useCallback } from "react"
import { api } from "@/lib/api/api-client"
import { useAuth } from "@/lib/hooks/useAuth"

interface UseAuthApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useAuthApi<T = any>(options: UseAuthApiOptions = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const request = useCallback(
    async <R = T>(
      method: "get" | "post" | "put" | "patch" | "delete",
      endpoint: string,
      body?: any,
      requestOptions?: Record<string, any>,
    ): Promise<R | null> => {
      if (!user) {
        const authError = new Error("Authentication required")
        setError(authError)
        options.onError?.(authError)
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        let result

        switch (method) {
          case "get":
            result = await api.get<R>(endpoint, requestOptions)
            break
          case "post":
            result = await api.post<R>(endpoint, body, requestOptions)
            break
          case "put":
            result = await api.put<R>(endpoint, body, requestOptions)
            break
          case "patch":
            result = await api.patch<R>(endpoint, body, requestOptions)
            break
          case "delete":
            result = await api.delete<R>(endpoint, requestOptions)
            break
        }

        setData(result as unknown as T)
        options.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        options.onError?.(error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user, options],
  )

  return {
    data,
    error,
    isLoading,
    get: useCallback(
      <R = T>(endpoint: string, requestOptions?: Record<string, any>) =>
        request<R>("get", endpoint, undefined, requestOptions),
      [request],
    ),
    post: useCallback(
      <R = T>(endpoint: string, body: any, requestOptions?: Record<string, any>) =>
        request<R>("post", endpoint, body, requestOptions),
      [request],
    ),
    put: useCallback(
      <R = T>(endpoint: string, body: any, requestOptions?: Record<string, any>) =>
        request<R>("put", endpoint, body, requestOptions),
      [request],
    ),
    patch: useCallback(
      <R = T>(endpoint: string, body: any, requestOptions?: Record<string, any>) =>
        request<R>("patch", endpoint, body, requestOptions),
      [request],
    ),
    delete: useCallback(
      <R = T>(endpoint: string, requestOptions?: Record<string, any>) =>
        request<R>("delete", endpoint, undefined, requestOptions),
      [request],
    ),
  }
}

