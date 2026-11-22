import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteDocument,
  getDocuments,
  getDocumentStatus,
  processDocument,
  retryDocument,
  uploadDocument,
} from './document.api'

export const documentsQueryKey = ['documents']

export function useDocuments(page: number) {
  return useQuery({
    queryKey: [...documentsQueryKey, page],
    queryFn: () => getDocuments(page),
  })
}

export function useDocumentStatus(documentId: number, enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: [...documentsQueryKey, 'status', documentId],
    queryFn: () => getDocumentStatus(documentId),
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? 2_000 : false,
  })
}

export function useDocumentMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: documentsQueryKey })

  const upload = useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (progress: number) => void
    }) => uploadDocument(file, onProgress),
    onSuccess: invalidate,
  })
  const process = useMutation({ mutationFn: processDocument, onSuccess: invalidate })
  const retry = useMutation({ mutationFn: retryDocument, onSuccess: invalidate })
  const remove = useMutation({ mutationFn: deleteDocument, onSuccess: invalidate })

  return { upload, process, retry, remove }
}
