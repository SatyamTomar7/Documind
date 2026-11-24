import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteDocument,
  getDocuments,
  getDocumentStatus,
  processDocument,
  retryDocument,
  uploadDocument,
} from './document.api'

export const documentsQueryKey = ['documents'] as const
export const documentListQueryKey = [...documentsQueryKey, 'list'] as const
export const documentStatusQueryKey = [...documentsQueryKey, 'status'] as const

export function useDocuments(page: number) {
  return useQuery({
    queryKey: [...documentListQueryKey, page],
    queryFn: () => getDocuments(page),
  })
}

export function useDocumentStatus(documentId: number, enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: [...documentStatusQueryKey, documentId],
    queryFn: () => getDocumentStatus(documentId),
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? 2_000 : false,
  })
}

export function useDocumentMutations() {
  const queryClient = useQueryClient()
  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: documentListQueryKey })

  const upload = useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (progress: number) => void
    }) => uploadDocument(file, onProgress),
    onSuccess: invalidateLists,
  })
  const process = useMutation({ mutationFn: processDocument, onSuccess: invalidateLists })
  const retry = useMutation({ mutationFn: retryDocument, onSuccess: invalidateLists })
  const remove = useMutation({ mutationFn: deleteDocument, onSuccess: invalidateLists })

  return { upload, process, retry, remove }
}
