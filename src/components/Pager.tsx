import { Button } from './ui/button'

export default function Pager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span>Page {page} of {pageCount}</span>
      <Button variant="outline" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  )
}
