import type { ApiError } from "@/types/media";

export class ApiRequestError extends Error {
  code: string;
  details?: Record<string, unknown>;
  status: number;

  constructor(status: number, error: ApiError) {
    super(error.message || "An unexpected error occurred");
    this.name = "ApiRequestError";
    this.code = error.code || "UNKNOWN_ERROR";
    this.details = error.details;
    this.status = status;
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorData: ApiError = data?.error || {
      code: `HTTP_${response.status}`,
      message: data?.message || response.statusText || "Request failed",
    };
    throw new ApiRequestError(response.status, errorData);
  }

  return (data?.data ?? data) as T;
}
