export type Conversation = {
  id: number
  documentId: number
  title: string | null
  createdAt: string
  updatedAt: string
}

export type Message = {
  id: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

export type ConversationDetail = {
  conversation: Conversation
  messages: Message[]
  pagination: {
    limit: number
    beforeId: number | null
    hasMore: boolean
    nextBeforeId: number | null
  }
}

type ApiEnvelope<T> = { data: T }

export type ApiResponse<T> = ApiEnvelope<T>
