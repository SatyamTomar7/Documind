import { api } from '../../lib/api'
import type {
  ApiResponse,
  DocumentItem,
  DocumentListResponse,
  DocumentStatusResponse,
} from './document.types'

export const getDocuments = async (page = 1, limit = 20) => {
  const response = await api.get<ApiResponse<DocumentListResponse>>('/fetchdoc', {
    params: { page, limit },
  })
  return response.data.data
}

export const getDocumentStatus = async (documentId: number) => {
  const response = await api.get<ApiResponse<DocumentStatusResponse>>(
    `/documents/${documentId}/status`,
  )
  return response.data.data
}

export const uploadDocument = async (
  file: File,
  onProgress?: (progress: number) => void,
) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<ApiResponse<DocumentItem>>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    },
  })
  return response.data.data
}

export const processDocument = async (documentId: number) => {
  await api.post(`/documents/${documentId}/process`)
}

export const retryDocument = async (documentId: number) => {
  await api.post(`/documents/${documentId}/retry`)
}

export const deleteDocument = async (documentId: number) => {
  await api.delete(`/documents/${documentId}`)
}
