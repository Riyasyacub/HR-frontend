import { useState } from 'react'
import { downloadReport, type ReportParams } from '../../api/reports'
import { Button } from '../ui/button'

type Props = { accessToken: string; report: string; params: ReportParams }

export default function DownloadReportButton({ accessToken, report, params }: Props) {
  const [error, setError] = useState('')

  async function download() {
    setError('')
    try {
      const url = URL.createObjectURL(await downloadReport(accessToken, report, params))
      Object.assign(document.createElement('a'), { href: url, download: `${report}.xlsx` }).click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Could not download the report.')
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => void download()}>Download XLSX</Button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </>
  )
}
