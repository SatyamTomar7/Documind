export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type DocumentItem = {
  id: number
  originalName: string
  mimeType: string
  size: number
  status: DocumentStatus
  createdAt: string
  updatedAt: string
}

export type DocumentListResponse = {
  documents: DocumentItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type ApiEnvelope<T> = { data: T }

export type ApiResponse<T> = ApiEnvelope<T>
