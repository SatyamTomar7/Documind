import { api } from '../../lib/api'
import type {
  ApiResponse,
  Conversation,
  ConversationDetail,
  Message,
} from './conversation.types'

export const getConversations = async () => {
  const response = await api.get<ApiResponse<Conversation[]>>('/conversations')
  return response.data.data
}

export const createConversation = async (documentId: number, title?: string) => {
  const response = await api.post<ApiResponse<Conversation>>('/conversations', {
    documentId,
    title,
  })
  return response.data.data
}

export const getConversation = async (conversationId: number) => {
  const response = await api.get<ApiResponse<ConversationDetail>>(
    `/conversations/${conversationId}`,
  )
  return response.data.data
}

export const askQuestion = async (conversationId: number, content: string) => {
  const response = await api.post<
    ApiResponse<{
      userMessage: Message
      assistantMessage: Message
      citations: Array<{ source: number; chunkIndex: number }>
      grounded: boolean
    }>
  >(`/conversations/${conversationId}/messages/ask`, { content })
  return response.data.data
}

export const deleteConversation = async (conversationId: number) => {
  await api.delete(`/conversations/${conversationId}`)
}
