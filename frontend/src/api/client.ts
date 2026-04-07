export const API_BASE = "http://localhost:5000/api"

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface ApiErrorDetail {
  msg?: string
  path?: string
}

export class ApiRequestError extends Error {
  status: number
  details?: ApiErrorDetail[]

  constructor(message: string, status: number, details?: ApiErrorDetail[]) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.details = details
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  // Attach token if available
  const token = localStorage.getItem("token")
  if (token) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config)
  const raw = await res.text()
  const data = raw ? JSON.parse(raw) : null

  if (!res.ok) {
    const details = Array.isArray(data?.data) ? (data.data as ApiErrorDetail[]) : undefined
    const detailMessage = details?.length
      ? details
          .map((detail) => {
            if (detail.path && detail.msg) return `${detail.path}: ${detail.msg}`
            return detail.msg || detail.path || ""
          })
          .filter(Boolean)
          .join(", ")
      : ""

    throw new ApiRequestError(
      detailMessage ? `${data?.message || "Request failed"} (${detailMessage})` : data?.message || "Request failed",
      res.status,
      details,
    )
  }

  return data as T
}
