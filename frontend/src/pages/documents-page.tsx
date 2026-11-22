import { FileText, LoaderCircle, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  useDocuments,
  useDocumentMutations,
  useDocumentStatus,
} from '../features/documents/document.hooks'
import type { DocumentItem, DocumentStatus } from '../features/documents/document.types'

const acceptedTypes = '.pdf,.txt,.docx'
const maxUploadSize = 10 * 1024 * 1024
const allowedExtensions = ['.pdf', '.txt', '.docx']

export function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data, isLoading, isError } = useDocuments(page)
  const { upload, process, retry, remove } = useDocumentMutations()
  const isMutating = upload.isPending || process.isPending || retry.isPending || remove.isPending

  const handleUpload = async (file?: File) => {
    if (!file) return
    setErrorMessage(null)
    const lowerName = file.name.toLowerCase()

    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      setErrorMessage('Only PDF, TXT, and DOCX files are allowed.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > maxUploadSize) {
      setErrorMessage('The selected file exceeds the 10 MB upload limit.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploadProgress(0)
    try {
      await upload.mutateAsync({
        file,
        onProgress: setUploadProgress,
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setErrorMessage('Upload failed. Check the file type and size, then try again.')
    } finally {
      setUploadProgress(null)
    }
  }

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    setErrorMessage(null)
    try {
      await action()
    } catch {
      setErrorMessage(message)
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Knowledge base
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-3 text-slate-400">
            Upload files and turn them into searchable, grounded knowledge.
          </p>
        </div>
        <div>
          <input
            accept={acceptedTypes}
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
            ref={fileInputRef}
            type="file"
          />
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isMutating}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload size={18} />
            {uploadProgress === null ? 'Upload document' : `Uploading ${uploadProgress}%`}
          </button>
        </div>
      </div>

      {uploadProgress !== null && (
        <div
          aria-label="Upload progress"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={uploadProgress}
          className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-cyan-400 transition-[width]"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </p>
      )}

      <div className="mt-10">
        {isLoading && <LoadingState />}
        {isError && (
          <EmptyState
            description="We could not load your documents. Refresh and try again."
            title="Unable to load documents"
          />
        )}
        {!isLoading && !isError && data?.documents.length === 0 && (
          <EmptyState
            description="Upload a PDF, TXT, or DOCX file to create your first searchable document."
            title="Your library is empty"
          />
        )}
        {!isLoading && !isError && data && data.documents.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {data.documents.map((document) => (
                <DocumentCard
                  document={document}
                  key={document.id}
                  onDelete={() =>
                    void runAction(
                      () => remove.mutateAsync(document.id),
                      'Could not delete this document.',
                    )
                  }
                  onProcess={(status) =>
                    void runAction(
                      () =>
                        (status === 'failed'
                          ? retry.mutateAsync(document.id)
                          : process.mutateAsync(document.id)),
                      'Could not process this document.',
                    )
                  }
                />
              ))}
            </div>
            {data.pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between text-sm text-slate-400">
                <span>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500 disabled:opacity-40"
                    disabled={page === 1}
                    onClick={() => setPage((current) => current - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500 disabled:opacity-40"
                    disabled={page === data.pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function DocumentCard({
  document,
  onDelete,
  onProcess,
}: {
  document: DocumentItem
  onDelete: () => void
  onProcess: (status: DocumentStatus) => void
}) {
  const statusQuery = useDocumentStatus(document.id, document.status === 'processing')
  const status = statusQuery.data?.status ?? document.status
  const isWorking = status === 'processing'
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
            <FileText size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-medium text-slate-100">{document.originalName}</h2>
            <p className="mt-1 text-xs text-slate-500">{formatBytes(document.size)}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        {status !== 'completed' && (
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
            disabled={isWorking}
            onClick={() => onProcess(status)}
            type="button"
          >
            {isWorking ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {status === 'failed' ? 'Retry' : 'Process'}
          </button>
        )}
        <button
          aria-label={`Delete ${document.originalName}`}
          className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"
          onClick={onDelete}
          type="button"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    pending: 'bg-amber-400/10 text-amber-300',
    processing: 'bg-cyan-400/10 text-cyan-300',
    completed: 'bg-emerald-400/10 text-emerald-300',
    failed: 'bg-rose-400/10 text-rose-300',
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>
}

function LoadingState() {
  return <div className="h-40 animate-pulse rounded-2xl bg-slate-900/60" />
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
