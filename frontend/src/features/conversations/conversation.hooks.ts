import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  askQuestion,
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
} from './conversation.api'

export const conversationsQueryKey = ['conversations']

export function useConversations() {
  return useQuery({
    queryKey: conversationsQueryKey,
    queryFn: getConversations,
  })
}

export function useConversation(conversationId: number | null) {
  return useQuery({
    enabled: conversationId !== null,
    queryKey: [...conversationsQueryKey, conversationId],
    queryFn: () => getConversation(conversationId as number),
  })
}

export function useConversationMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: conversationsQueryKey })

  return {
    create: useMutation({ mutationFn: ({ documentId, title }: { documentId: number; title?: string }) => createConversation(documentId, title), onSuccess: invalidate }),
    ask: useMutation({ mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) => askQuestion(conversationId, content), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: deleteConversation, onSuccess: invalidate }),
  }
}
