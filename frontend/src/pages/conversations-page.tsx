import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquare, Plus, Send, Square, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  useConversation,
  useConversationMutations,
  useConversations,
} from '../features/conversations/conversation.hooks'
import type { Conversation } from '../features/conversations/conversation.types'
import { streamDocumentQuestion } from '../features/conversations/conversation.api'

const createSchema = z.object({
  documentId: z.coerce.number().int().positive('Enter a valid document ID'),
  title: z.string().trim().max(255).optional(),
})

const questionSchema = z.object({
  content: z.string().trim().min(1, 'Enter a question').max(10_000),
})

type CreateValues = z.infer<typeof createSchema>
type QuestionValues = z.infer<typeof questionSchema>

export function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const [streamingQuestion, setStreamingQuestion] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const streamControllerRef = useRef<AbortController | null>(null)
  const { data: conversations, isLoading } = useConversations()
  const detail = useConversation(selectedId)
  const { create, remove } = useConversationMutations()
  const createForm = useForm<z.input<typeof createSchema>, unknown, CreateValues>({
    resolver: zodResolver(createSchema),
  })
  const questionForm = useForm<QuestionValues>({ resolver: zodResolver(questionSchema) })

  useEffect(() => () => streamControllerRef.current?.abort(), [])

  const selectConversation = (conversationId: number | null) => {
    streamControllerRef.current?.abort()
    streamControllerRef.current = null
    setIsStreaming(false)
    setStreamingAnswer('')
    setStreamingQuestion(null)
    setSelectedId(conversationId)
  }

  const onCreate = async (values: CreateValues) => {
    setErrorMessage(null)
    try {
      const conversation = await create.mutateAsync(values)
      selectConversation(conversation.id)
      createForm.reset()
    } catch {
      setErrorMessage('Could not create the conversation. Check the document ID.')
    }
  }

  const onAsk = async (values: QuestionValues) => {
    if (selectedId === null || !detail.data) return
    setErrorMessage(null)
    streamControllerRef.current?.abort()
    const controller = new AbortController()
    streamControllerRef.current = controller
    setIsStreaming(true)
    setStreamingQuestion(values.content)
    setStreamingAnswer('')

    try {
      await streamDocumentQuestion(
        detail.data.conversation.documentId,
        values.content,
        (event) => {
          if (event.type === 'chunk') {
            setStreamingAnswer((current) => current + event.chunk)
          } else if (event.type === 'error') {
            setErrorMessage(event.message)
          }
        },
        controller.signal,
      )
      questionForm.reset()
    } catch {
      if (!controller.signal.aborted) {
        setErrorMessage('Could not generate an answer. Please try again.')
      }
    } finally {
      if (streamControllerRef.current === controller) {
        streamControllerRef.current = null
        setIsStreaming(false)
      }
    }
  }

  const cancelStreaming = () => {
    streamControllerRef.current?.abort()
    streamControllerRef.current = null
    setIsStreaming(false)
    setStreamingQuestion(null)
    setStreamingAnswer('')
  }

  const onDelete = async (conversation: Conversation) => {
    setErrorMessage(null)
    try {
      await remove.mutateAsync(conversation.id)
      if (selectedId === conversation.id) selectConversation(null)
    } catch {
      setErrorMessage('Could not delete this conversation.')
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Ask your knowledge base
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Conversations</h1>
      </div>

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-4">
          <form
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            onSubmit={createForm.handleSubmit(onCreate)}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Plus size={17} />
              New conversation
            </div>
            <input
              className="auth-input mt-4"
              placeholder="Document ID"
              type="number"
              {...createForm.register('documentId')}
            />
            {createForm.formState.errors.documentId && (
              <p className="mt-2 text-xs text-rose-300">
                {createForm.formState.errors.documentId.message}
              </p>
            )}
            <input
              className="auth-input mt-3"
              placeholder="Optional title"
              {...createForm.register('title')}
            />
            <button className="auth-button mt-4" disabled={create.isPending} type="submit">
              {create.isPending ? 'Creating…' : 'Create conversation'}
            </button>
          </form>

          <div className="space-y-2">
            {isLoading && <div className="h-20 animate-pulse rounded-2xl bg-slate-900/60" />}
            {conversations?.map((conversation) => (
              <ConversationRow
                conversation={conversation}
                key={conversation.id}
                onDelete={() => void onDelete(conversation)}
                onSelect={() => selectConversation(conversation.id)}
                selected={conversation.id === selectedId}
              />
            ))}
            {!isLoading && conversations?.length === 0 && (
              <p className="px-2 text-sm text-slate-500">No conversations yet.</p>
            )}
          </div>
        </aside>

        <section className="flex min-h-[34rem] flex-col rounded-2xl border border-slate-800 bg-slate-900/40">
          {selectedId === null ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <MessageSquare className="mx-auto text-slate-600" size={32} />
                <p className="mt-4 text-slate-400">Select a conversation to begin.</p>
              </div>
            </div>
          ) : detail.isLoading ? (
            <div className="m-6 h-24 animate-pulse rounded-xl bg-slate-800" />
          ) : detail.data ? (
            <>
              <header className="border-b border-slate-800 px-6 py-5">
                <h2 className="font-semibold">{detail.data.conversation.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Document {detail.data.conversation.documentId}
                </p>
              </header>
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {detail.data.messages.map((message) => (
                  <div
                    className={message.role === 'user' ? 'ml-auto max-w-xl' : 'max-w-2xl'}
                    key={message.id}
                  >
                    <p className="mb-1 text-xs uppercase tracking-wider text-slate-600">
                      {message.role}
                    </p>
                    <div
                      className={
                        message.role === 'user'
                          ? 'rounded-2xl rounded-br-sm bg-cyan-400 px-4 py-3 text-slate-950'
                          : 'rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-slate-200'
                      }
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {streamingQuestion && (
                  <div className="ml-auto max-w-xl">
                    <p className="mb-1 text-xs uppercase tracking-wider text-slate-600">user</p>
                    <div className="rounded-2xl rounded-br-sm bg-cyan-400 px-4 py-3 text-slate-950">
                      {streamingQuestion}
                    </div>
                  </div>
                )}
                {(streamingAnswer || streamingQuestion) && (
                  <div className="max-w-2xl">
                    <p className="mb-1 text-xs uppercase tracking-wider text-slate-600">assistant</p>
                    <div className="min-h-12 rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-slate-200">
                      {streamingAnswer || 'Generating answer…'}
                    </div>
                  </div>
                )}
              </div>
              <form className="border-t border-slate-800 p-4" onSubmit={questionForm.handleSubmit(onAsk)}>
                <div className="flex gap-3">
                  <textarea
                    className="auth-input min-h-12 resize-y"
                    placeholder="Ask a question about this document…"
                    {...questionForm.register('content')}
                  />
                  <button
                    aria-label={isStreaming ? 'Cancel answer' : 'Send question'}
                    className="self-end rounded-xl bg-cyan-400 p-3 text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                    onClick={
                      isStreaming
                        ? (event) => {
                            event.preventDefault()
                            cancelStreaming()
                          }
                        : undefined
                    }
                    type={isStreaming ? 'button' : 'submit'}
                  >
                    {isStreaming ? <Square size={18} /> : <Send size={18} />}
                  </button>
                </div>
                {questionForm.formState.errors.content && (
                  <p className="mt-2 text-xs text-rose-300">
                    {questionForm.formState.errors.content.message}
                  </p>
                )}
              </form>
            </>
          ) : (
            <p className="p-6 text-slate-400">Unable to load this conversation.</p>
          )}
        </section>
      </div>
    </section>
  )
}

function ConversationRow({
  conversation,
  onDelete,
  onSelect,
  selected,
}: {
  conversation: Conversation
  onDelete: () => void
  onSelect: () => void
  selected: boolean
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border p-3 ${selected ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-slate-800 bg-slate-900/40'}`}>
      <button className="min-w-0 flex-1 text-left" onClick={onSelect} type="button">
        <p className="truncate text-sm font-medium text-slate-200">{conversation.title}</p>
        <p className="mt-1 text-xs text-slate-500">Document {conversation.documentId}</p>
      </button>
      <button
        aria-label={`Delete ${conversation.title}`}
        className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"
        onClick={onDelete}
        type="button"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
