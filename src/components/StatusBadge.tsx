const TONES: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success', completed: 'success', paid: 'success', queued: 'warning', processing: 'warning', draft: 'warning',
  failed: 'danger', generated: 'info',
}
const TONE_CLASSES = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20', info: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20', neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
}

export default function StatusBadge({ status, tone: forcedTone }: { status: string; tone?: keyof typeof TONE_CLASSES }) {
  const tone = forcedTone ?? TONES[status] ?? 'neutral'
  return <span data-tone={tone} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]}`}>{status}</span>
}
