import { Button } from './ui/button'
import { Input } from './ui/input'
import type { CompensationComponentInput } from '../api/employees'

type Props = {
  currency: string
  components: CompensationComponentInput[]
  onChange: (components: CompensationComponentInput[]) => void
}

export default function CompensationInputs({ currency, components, onChange }: Props) {
  const annualCtc = components.reduce((sum, c) => sum + (Number(c.annual_amount) || 0), 0)

  function update(index: number, field: 'name' | 'annual_amount', value: string) {
    const next = components.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    onChange(next)
  }

  function add() {
    onChange([...components, { name: '', annual_amount: '' }])
  }

  function remove(index: number) {
    if (components.length <= 1) return
    onChange(components.filter((_, i) => i !== index))
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Compensation components</h2>
        <Button type="button" variant="outline" size="sm" onClick={add}>Add component</Button>
      </div>
      {components.map((c, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input placeholder="Component name" value={c.name} onChange={(e) => update(index, 'name', e.target.value)} required />
          <Input type="number" step="0.01" placeholder="Annual amount" value={c.annual_amount} onChange={(e) => update(index, 'annual_amount', e.target.value)} required />
          {components.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>Remove</Button>}
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        Derived annual CTC: <span className="font-semibold">{annualCtc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
      </p>
    </div>
  )
}
