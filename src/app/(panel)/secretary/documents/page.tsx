'use client'

import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Search, Upload, Eye, Download, EllipsisVertical, Folder, FileText,
} from 'lucide-react'
import { Card } from '@/Components/ui'
import UploadDocumentModal, { type DocumentPayload } from '@/Components/UploadDocumentModal'

/* ---------- Animation ---------- */

// Smooth "expo-out" curve: starts fast, settles softly
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Replays every time a section enters the screen (set once: true to play only once)
const VIEWPORT = { once: false, amount: 0.15 }

// Container: children appear one after another
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

// Each child fades in while moving up and scaling slightly
const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
}

/* ---------- Types ---------- */
type Category = 'Legal' | 'Finance' | 'Society' | 'Meeting' | 'Vendor' | 'Maintenance'

type DocRow = {
  id: number
  name: string
  category: Category
  by: string
  date: string
  size: string
  url?: string // local preview/download link of the newly uploaded document
}

type FolderRow = {
  label: string
  count: number
  cat: Category | 'All'
}

/* ---------- Data (replace with API later) ---------- */
const baseFolders: FolderRow[] = [
  { label: 'All Documents', count: 48, cat: 'All' },
  { label: 'Society Documents', count: 12, cat: 'Society' },
  { label: 'Legal Documents', count: 8, cat: 'Legal' },
  { label: 'Financial Documents', count: 10, cat: 'Finance' },
  { label: 'Meeting Minutes', count: 6, cat: 'Meeting' },
  { label: 'Vendor Contracts', count: 7, cat: 'Vendor' },
  { label: 'Maintenance Docs', count: 5, cat: 'Maintenance' },
]

const initialDocs: DocRow[] = [
  { id: 1, name: 'Society Registration.pdf', category: 'Legal', by: 'Admin', date: '02 Oct 2026', size: '2.4 MB' },
  { id: 2, name: 'Vendor Contract - Security.pdf', category: 'Vendor', by: 'Admin', date: '01 Oct 2026', size: '1.8 MB' },
  { id: 3, name: 'Maintenance Schedule.pdf', category: 'Maintenance', by: 'Ramesh Kumar', date: '29 Sep 2026', size: '1.2 MB' },
  { id: 4, name: 'Financial Statement.pdf', category: 'Finance', by: 'Admin', date: '25 Sep 2026', size: '3.1 MB' },
  { id: 5, name: 'Meeting Minutes - Sep.pdf', category: 'Meeting', by: 'Admin', date: '22 Sep 2026', size: '980 KB' },
]

const tabs: (Category | 'All')[] = ['All', 'Legal', 'Finance', 'Society', 'Meeting', 'Vendor']

/* ---------- Helpers ---------- */
const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// Icon colour based on file type
const fileColor = (name: string) => {
  if (/\.pdf$/i.test(name)) return 'bg-red-500/15 text-red-400'
  if (/\.docx?$/i.test(name)) return 'bg-blue-500/15 text-blue-400'
  if (/\.xlsx?$/i.test(name)) return 'bg-emerald-500/15 text-emerald-400'
  return 'bg-amber-500/15 text-amber-400'
}

/* ---------- Shared styles (same as dashboard) ---------- */
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

/* ---------- Small pieces ---------- */
function FileIcon({ name }: { name: string }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${fileColor(name)}`}>
      <FileText className="h-4 w-4" />
    </span>
  )
}

function Actions({ doc }: { doc: DocRow }) {
  return (
    <div className="flex items-center gap-0.5 text-slate-400">
      {/* View: a newly uploaded document opens in a new tab */}
      <button
        type="button"
        aria-label="View"
        onClick={() => doc.url && window.open(doc.url, '_blank')}
        className="rounded-md p-1.5 hover:bg-white/5 hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {/* Download: a newly uploaded document gets downloaded */}
      {doc.url ? (
        <a
          href={doc.url}
          download={doc.name}
          aria-label="Download"
          className="rounded-md p-1.5 hover:bg-white/5 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      ) : (
        <button type="button" aria-label="Download" className="rounded-md p-1.5 hover:bg-white/5 hover:text-white">
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="button" aria-label="More" className="rounded-md p-1.5 hover:bg-white/5 hover:text-white">
        <EllipsisVertical className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ---------- Page ---------- */
export default function DocumentsPage() {
  // Documents data + modal state
  const [items, setItems] = useState<DocRow[]>(initialDocs)
  const [uploaded, setUploaded] = useState<Category[]>([]) // categories of the new documents
  const [showUploadModal, setShowUploadModal] = useState(false)

  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | 'All'>('All')

  // Add the new document from the modal to the table
  function handleSave(d: DocumentPayload) {
    const category = d.category as Category
    const newDoc: DocRow = {
      id: d.id,
      name: d.file.name,
      category,
      by: 'Admin',
      date: fmtDate(d.date),
      size: fmtSize(d.file.size),
      // Local preview link (use the server URL once the backend is ready)
      url: URL.createObjectURL(d.file),
    }
    setItems((prev) => [newDoc, ...prev])
    setUploaded((prev) => [...prev, category])
  }

  // Folder counts (increase when a new document is uploaded)
  const folders = useMemo(
    () =>
      baseFolders.map((f) => ({
        ...f,
        count:
          f.count +
          (f.cat === 'All' ? uploaded.length : uploaded.filter((c) => c === f.cat).length),
      })),
    [uploaded],
  )

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return items.filter(
      (d) =>
        (cat === 'All' || d.category === cat) &&
        (term === '' || d.name.toLowerCase().includes(term) || d.by.toLowerCase().includes(term)),
    )
  }, [items, q, cat])

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Documents</h1>
          <p className="text-xs text-slate-400">Centralized storage for society documents</p>
        </motion.div>
        {/* Primary button: opens the Upload Document modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </button>
        </motion.div>
      </motion.div>

      {/* Tabs + Search */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
          {tabs.map((t) => (
            <motion.button
              key={t}
              variants={item}
              type="button"
              onClick={() => setCat(t)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                cat === t
                  ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] text-white'
                  : 'border-[#272D39] bg-[#10131A] text-slate-300 hover:bg-white/5'
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>

        <motion.div variants={item} className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60"
          />
        </motion.div>
      </motion.div>

      {/* Folders + Documents */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]"
      >
        {/* Folders: phone/tablet = horizontal scroll, desktop = vertical list */}
        <motion.div variants={item} className="self-start rounded-xl border border-[#272D39] bg-[#10131A] p-2">
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {folders.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setCat(f.cat)}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                  cat === f.cat ? 'bg-[#6D5EF5]/20 text-white' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Folder className="h-4 w-4 fill-amber-400/80 text-amber-400" />
                  {f.label}
                </span>
                <span className="text-[10px] text-slate-400">{f.count}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="min-w-0">
          {/* Desktop / tablet: table */}
          <motion.div variants={item} className="hidden md:block">
            <Card title="All Documents" sub={`${list.length} documents`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Document</th>
                      <th className={th}>Category</th>
                      <th className={th}>Uploaded By</th>
                      <th className={th}>Date</th>
                      <th className={th}>Size</th>
                      <th className={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((d) => (
                      <tr key={d.id} className="hover:bg-white/[0.02]">
                        <td className={td}>
                          <span className="flex items-center gap-3">
                            <FileIcon name={d.name} />
                            <span className="font-medium">{d.name}</span>
                          </span>
                        </td>
                        <td className={`${td} text-slate-400`}>{d.category}</td>
                        <td className={`${td} text-slate-400`}>{d.by}</td>
                        <td className={`${td} text-slate-400`}>{d.date}</td>
                        <td className={`${td} text-slate-400`}>{d.size}</td>
                        <td className={td}><Actions doc={d} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* Phone: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {list.map((d) => (
              <motion.div
                key={d.id}
                variants={item}
                className="rounded-xl border border-[#272D39] bg-[#10131A] p-4"
              >
                <div className="flex items-center gap-3">
                  <FileIcon name={d.name} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{d.name}</p>
                    <p className="truncate text-[10px] text-slate-400">{d.category}</p>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <dt className="text-slate-500">Uploaded By</dt>
                    <dd className="mt-0.5 text-slate-300">{d.by}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Date</dt>
                    <dd className="mt-0.5 text-slate-300">{d.date}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Size</dt>
                    <dd className="mt-0.5 text-slate-300">{d.size}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex justify-end border-t border-[#272D39] pt-2">
                  <Actions doc={d} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty state */}
          {list.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#272D39] p-10 text-center text-xs text-slate-400">
              No documents found.
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Document modal */}
      <UploadDocumentModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSave={handleSave}
      />
    </div>
  )
}