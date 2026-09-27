export interface MediaItem {
  id: string;
  weddingId: string;
  filename: string;
  mimeType: string;
  size: number;
  wishes?: string;
  fromName?: string;
  signature?: string;
  code?: string;
  createdAt: string;
}

export interface MediaUrlData {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}
