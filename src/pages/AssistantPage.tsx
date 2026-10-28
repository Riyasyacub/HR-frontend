import { useEffect, useState, type FormEvent } from 'react'
import { askAssistant, listAssistantHistory, type AssistantAnswer } from '../api/assistant'
import { useAuth } from '../auth/AuthContext'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const EXAMPLES = ['Headcount by country', 'Joiners per month this year', 'Leave days taken by type this month']
type Entry = { key: string; question: string; answer?: AssistantAnswer; error?: string; pending?: boolean }

function AnswerTable({ answer }: { answer: AssistantAnswer }) {
  if (answer.row_count === 0) return <p className="text-sm text-muted-foreground">No matching data.</p>
  return (
    <Table>
      <TableHeader><TableRow>{answer.columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{answer.rows.map((row, index) => <TableRow key={index}>{row.map((value, cell) => <TableCell key={cell}>{value === null ? '—' : String(value)}</TableCell>)}</TableRow>)}</TableBody>
    </Table>
  )
}

export default function AssistantPage() {
  const { session } = useAuth()
  const [question, setQuestion] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    if (!session) return
    listAssistantHistory(session.access_token).then(({ data }) => setEntries((current) => [...current.filter((entry) => entry.key.startsWith('new-')), ...data.map((item) => (
      { key: `past-${item.id}`, question: item.question, error: item.message ?? undefined }
    ))])).catch(() => undefined)
  }, [session])

  async function answer(key: string, asked: string) {
    if (!session) return
    const update = (patch: Partial<Entry>) => setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)))
    update({ pending: true, error: undefined })
    try {
      update({ answer: await askAssistant(session.access_token, asked), pending: false })
    } catch (err) {
      update({ error: err instanceof Error ? err.message : 'The assistant could not answer.', pending: false })
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const asked = question.trim()
    if (!asked) return
    const key = `new-${Date.now()}`
    setEntries((current) => [{ key, question: asked, pending: true }, ...current])
    setQuestion('')
    void answer(key, asked)
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <PageHeader title="Assistant" description="Ask a question about the HR data you can see; answers come back as a table." />
      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex gap-2">
          <Input aria-label="Question" maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="e.g. headcount by department" />
          <Button type="submit" disabled={!question.trim()}>Ask</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => <Button key={example} type="button" size="sm" variant="outline" onClick={() => setQuestion(example)}>{example}</Button>)}
        </div>
      </form>
      {entries.map((entry) => (
        <article key={entry.key} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2"><p className="font-medium">{entry.question}</p>{entry.answer?.cached && <StatusBadge status="Cached" tone="info" />}</div>
          {entry.pending && <p className="text-sm text-muted-foreground">Thinking…</p>}
          {!entry.pending && !entry.answer && !entry.error && <Button size="sm" variant="outline" onClick={() => void answer(entry.key, entry.question)}>Show answer</Button>}
          {entry.error && <p role="alert" className="text-sm text-destructive">{entry.error}</p>}
          {entry.answer && <AnswerTable answer={entry.answer} />}
          {entry.answer?.truncated && <p className="text-xs text-muted-foreground">Showing the first 200 rows.</p>}
        </article>
      ))}
    </main>
  )
}
