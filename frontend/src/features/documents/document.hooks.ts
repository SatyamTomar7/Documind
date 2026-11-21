import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteDocument,
  getDocuments,
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

export function useDocumentMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: documentsQueryKey })

  const upload = useMutation({ mutationFn: uploadDocument, onSuccess: invalidate })
  const process = useMutation({ mutationFn: processDocument, onSuccess: invalidate })
  const retry = useMutation({ mutationFn: retryDocument, onSuccess: invalidate })
  const remove = useMutation({ mutationFn: deleteDocument, onSuccess: invalidate })

  return { upload, process, retry, remove }
}
