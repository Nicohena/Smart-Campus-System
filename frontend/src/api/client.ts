const API_BASE = "http://localhost:5000/api"

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
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || "Request failed")
  }

  return data
}
