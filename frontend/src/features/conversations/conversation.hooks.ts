import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  askQuestion,
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
} from './conversation.api'

export const conversationsQueryKey = ['conversations'] as const
export const conversationListQueryKey = [...conversationsQueryKey, 'list'] as const
export const conversationDetailQueryKey = (conversationId: number) =>
  [...conversationsQueryKey, 'detail', conversationId] as const

export function useConversations() {
  return useQuery({
    queryKey: conversationListQueryKey,
    queryFn: getConversations,
  })
}

export function useConversation(conversationId: number | null) {
  return useQuery({
    enabled: conversationId !== null,
    queryKey:
      conversationId === null
        ? [...conversationsQueryKey, 'detail', null]
        : conversationDetailQueryKey(conversationId),
    queryFn: () => getConversation(conversationId as number),
  })
}

export function useConversationMutations() {
  const queryClient = useQueryClient()
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: conversationListQueryKey })

  return {
    create: useMutation({
      mutationFn: ({ documentId, title }: { documentId: number; title?: string }) =>
        createConversation(documentId, title),
      onSuccess: invalidateList,
    }),
    ask: useMutation({
      mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
        askQuestion(conversationId, content),
      onSuccess: (_result, { conversationId }) =>
        Promise.all([
          invalidateList(),
          queryClient.invalidateQueries({
            queryKey: conversationDetailQueryKey(conversationId),
            exact: true,
          }),
        ]),
    }),
    remove: useMutation({
      mutationFn: deleteConversation,
      onSuccess: (_result, conversationId) => {
        queryClient.removeQueries({
          queryKey: conversationDetailQueryKey(conversationId),
          exact: true,
        })
        return invalidateList()
      },
    }),
  }
}
