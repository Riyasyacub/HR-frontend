import { useEffect, useState } from 'react'
import { getLeaveBalances, type LeaveBalance } from '../api/leaves'

export default function LeaveBalances({ accessToken, employeeId }: { accessToken: string; employeeId: number }) {
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    getLeaveBalances(accessToken, employeeId).then(setBalances).catch(() => setError('Could not load leave balances.'))
  }, [accessToken, employeeId])

  return (
    <div className="border p-4 rounded text-sm space-y-1">
      <h2 className="font-semibold">Leave balances</h2>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {balances.map((balance) => (
        <p key={balance.leave_type}>{balance.leave_type}: {balance.remaining} of {balance.entitled} days left</p>
      ))}
    </div>
  )
}
