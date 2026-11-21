import { api } from '../../lib/api'
import type { ApiResponse, DocumentItem, DocumentListResponse } from './document.types'

export const getDocuments = async (page = 1, limit = 20) => {
  const response = await api.get<ApiResponse<DocumentListResponse>>('/fetchdoc', {
    params: { page, limit },
  })
  return response.data.data
}

export const uploadDocument = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<ApiResponse<DocumentItem>>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
