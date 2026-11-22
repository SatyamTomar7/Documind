import { api } from '../../lib/api'
import { apiBaseUrl } from '../../lib/api'
import { authStorage } from '../auth/auth.storage'
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

export type StreamEvent =
  | { type: 'chunk'; chunk: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export const streamDocumentQuestion = async (
  documentId: number,
  question: string,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
) => {
  const accessToken = authStorage.getAccessToken()
  const response = await fetch(`${apiBaseUrl}/documents/${documentId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ question }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Streaming failed with status ${response.status}`)
  }
  if (!response.body) {
    throw new Error('Streaming response has no body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const dataLine = event
        .split('\n')
        .find((line) => line.startsWith('data: '))
      if (!dataLine) continue

      try {
        const payload = JSON.parse(dataLine.slice(6)) as
          | { chunk: string }
          | { type: 'done' }
          | { type: 'error'; message: string }

        if ('chunk' in payload) {
          onEvent({ type: 'chunk', chunk: payload.chunk })
        } else if (payload.type === 'error') {
          onEvent(payload)
        } else {
          onEvent({ type: 'done' })
        }
      } catch {
        onEvent({ type: 'error', message: 'Received an invalid streaming response' })
      }
    }
  }
}
