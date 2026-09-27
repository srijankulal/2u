import { useState, useCallback } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../../components/AuthProvider'
import { useToast } from '../../components/ToastProvider'
import { createTypedLetterFn, createScannedLetterFn } from '../../server/letters'

const PRESET_OPTIONS = [
    { label: '6 Months', months: 6, years: 0 },
    { label: '1 Year', months: 0, years: 1 },
    { label: '2 Years', months: 0, years: 2 },
    { label: '3 Years', months: 0, years: 3 },
    { label: '5 Years', months: 0, years: 5 },
    { label: '10 Years', months: 0, years: 10 },
]

const INSPIRATION_PROMPTS = [
    { title: 'Reflections', text: 'Dear future self, right now my biggest fear is... and what I hope I achieved by now is...' },
    { title: 'Daily Life', text: 'Here is what my typical day looks like right now, the music I am obsessed with, and the people closest to me...' },
    { title: 'Milestones', text: 'I am writing this on the eve of a major crossroads in my life. I hope you made the brave choice...' },
    { title: 'Wisdom & Habits', text: 'Remember the lessons we learned the hard way this year: never compromise on...' },
]

function getPresetDate(years: number, months: number): string {
    const d = new Date()
    d.setFullYear(d.getFullYear() + years)
    d.setMonth(d.getMonth() + months)
    return d.toISOString().slice(0, 16)
}

export const Route = createFileRoute('/app/compose')({
    component: ComposePage,
})

function ComposePage() {
    const { user, refreshUser } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [mode, setMode] = useState<'typed' | 'scanned'>('typed')
    const [loading, setLoading] = useState(false)
    const [activePreset, setActivePreset] = useState<string>('1 Year')

    // Typed form state
    const [typed, setTyped] = useState({
        title: '',
        content: '',
        deliverAt: getPresetDate(1, 0),
    })

    // Scanned form state
    const [scanned, setScanned] = useState({
        title: '',
        deliverAt: getPresetDate(1, 0),
    })
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)

    const onDrop = useCallback((accepted: File[]) => {
        if (accepted[0]) {
            setFile(accepted[0])
            setPreview(URL.createObjectURL(accepted[0]))
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [], 'application/pdf': [] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB
    })

    // Min date: tomorrow
    const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16)

    const canWrite = (user?.slotsFree ?? 5) > 0

    const wordsCount = typed.content.trim().split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(1, Math.ceil(wordsCount / 200))

    const handlePresetClick = (years: number, months: number, label: string) => {
        const dateStr = getPresetDate(years, months)
        setActivePreset(label)
        if (mode === 'typed') {
            setTyped(p => ({ ...p, deliverAt: dateStr }))
        } else {
            setScanned(p => ({ ...p, deliverAt: dateStr }))
        }
    }

    const applyPrompt = (text: string) => {
        setTyped(p => ({
            ...p,
            content: p.content ? `${p.content}\n\n${text}` : text,
        }))
        showToast('Prompt inserted into letter', 'info')
    }

    const submitTyped = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canWrite) return
        if (!typed.title.trim()) {
            showToast('Please give your letter a title', 'error')
            return
        }
        if (!typed.content.trim()) {
            showToast('Please write some content in your letter', 'error')
            return
        }

        setLoading(true)
        try {
            await createTypedLetterFn({
                data: {
                    title: typed.title,
                    content: typed.content,
                    deliverAt: new Date(typed.deliverAt).toISOString(),
                }
            })
            await refreshUser()
            showToast('✉ Letter sealed with wax! It is now resting in the time vault.', 'success')
            navigate({ to: '/app' })
        } catch (err: any) {
            showToast(err?.message || 'Something went wrong', 'error')
        } finally {
            setLoading(false)
        }
    }

    const submitScanned = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !canWrite) {
            showToast('Please select an image of your handwritten letter', 'error')
            return
        }
        if (!scanned.title.trim()) {
            showToast('Please give your letter a title', 'error')
            return
        }

        setLoading(true)
        try {
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
            })
            reader.readAsDataURL(file)
            const base64Data = await base64Promise

            await createScannedLetterFn({
                data: {
                    title: scanned.title,
                    base64Data,
                    deliverAt: new Date(scanned.deliverAt).toISOString(),
                }
            })
            await refreshUser()
            showToast('📷 Handwritten letter preserved and sealed in the vault!', 'success')
            navigate({ to: '/app' })
        } catch (err: any) {
            showToast(err?.message || 'Something went wrong', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!canWrite) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📮</div>
                <h2 className="empty-state-title">All 5 Letter Slots are Full</h2>
                <p className="empty-state-sub">
                    You currently have 5 letters sealed in transit. As soon as one of your scheduled letters delivers, a slot will free up immediately.
                </p>
                <Link to="/app" className="btn btn-primary">
                    View My Letters →
                </Link>
            </div>
        )
    }

    return (
        <div className="compose-studio">
            <div style={{ marginBottom: 28 }}>
                <Link to="/app" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, color: 'var(--ink-muted)' }}>
                    ← Back to Mailbox
                </Link>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginTop: 12 }}>
                    Write to Your Future Self
                </h1>
                <p style={{ color: 'var(--ink-light)', fontSize: 15 }}>
                    Compose your thoughts, seal them with wax, and choose when to open them.
                </p>
            </div>

            {/* Mode Switcher */}
            <div className="compose-tab-switcher">
                <button
                    type="button"
                    className={`compose-tab-btn ${mode === 'typed' ? 'active' : ''}`}
                    onClick={() => setMode('typed')}
                >
                    <span>✒</span> Typed Letter
                </button>
                <button
                    type="button"
                    className={`compose-tab-btn ${mode === 'scanned' ? 'active' : ''}`}
                    onClick={() => setMode('scanned')}
                >
                    <span>📷</span> Handwritten Scan
                </button>
            </div>

            {/* ─── TYPED COMPOSITION MODE ─────────────────────────────────── */}
            {mode === 'typed' && (
                <form onSubmit={submitTyped}>
                    <div className="compose-paper">
                        {/* Title input */}
                        <input
                            type="text"
                            placeholder="Title of this letter… (e.g. Read this on my 30th birthday)"
                            value={typed.title}
                            onChange={e => setTyped(p => ({ ...p, title: e.target.value }))}
                            className="compose-input-title"
                            required
                        />

                        {/* Letter body */}
                        <div style={{ position: 'relative' }}>
                            <div style={{ fontFamily: 'var(--font-script)', fontSize: 24, color: 'var(--ink-light)', marginBottom: 16 }}>
                                Dear future self,
                            </div>
                            <textarea
                                placeholder="Pour your heart onto this parchment. What are you thinking about today? What goals are you chasing? What do you hope you never forget?..."
                                value={typed.content}
                                onChange={e => setTyped(p => ({ ...p, content: e.target.value }))}
                                className="compose-textarea"
                                required
                            />
                            <div style={{ textAlign: 'right', marginTop: 24, fontFamily: 'var(--font-script)', fontSize: 22, color: 'var(--ink-light)' }}>
                                — With love, past you
                            </div>
                        </div>

                        {/* Word counter */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--parchment-border)', fontSize: 12, color: 'var(--ink-muted)' }}>
                            <span>{wordsCount} words · ~{readingTime} min read</span>
                            <span>{user?.slotsFree ?? 5} slots available</span>
                        </div>
                    </div>

                    {/* Delivery Date Selection Card */}
                    <div style={{
                        background: 'var(--parchment-surface)',
                        border: '1px solid var(--parchment-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '28px 32px',
                        marginTop: '28px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 4 }}>
                            When Should This Letter Arrive?
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 14 }}>
                            Select a preset duration or pick an exact calendar date.
                        </p>

                        <div className="date-preset-grid">
                            {PRESET_OPTIONS.map(opt => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    className={`date-preset-btn ${activePreset === opt.label ? 'active' : ''}`}
                                    onClick={() => handlePresetClick(opt.years, opt.months, opt.label)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" htmlFor="typed-deliver-at">Exact Delivery Date & Time</label>
                            <input
                                id="typed-deliver-at"
                                type="datetime-local"
                                className="form-input"
                                min={minDate}
                                value={typed.deliverAt}
                                onChange={e => {
                                    setActivePreset('')
                                    setTyped(p => ({ ...p, deliverAt: e.target.value }))
                                }}
                                required
                            />
                        </div>
                    </div>

                    {/* Inspiration Prompts Accordion */}
                    <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-muted)', marginBottom: 10 }}>
                            💡 Need Inspiration? Click any prompt to insert:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                            {INSPIRATION_PROMPTS.map(pr => (
                                <div
                                    key={pr.title}
                                    onClick={() => applyPrompt(pr.text)}
                                    style={{
                                        background: 'var(--parchment-muted)',
                                        border: '1px solid var(--parchment-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '14px',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        color: 'var(--ink-light)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--parchment-border)')}
                                >
                                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>+ {pr.title}</div>
                                    <div style={{ fontSize: 12, opacity: 0.85, lineClamp: 2 }}>{pr.text}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ marginTop: 32, textAlign: 'center' }}>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ minWidth: 260, fontSize: 16 }}
                            disabled={loading}
                        >
                            {loading ? <><span className="spinner" /> Sealing with Wax…</> : '✉ Seal and Dispatch Letter'}
                        </button>
                    </div>
                </form>
            )}

            {/* ─── SCANNED COMPOSITION MODE ───────────────────────────────── */}
            {mode === 'scanned' && (
                <form onSubmit={submitScanned}>
                    <div className="compose-paper">
                        <input
                            type="text"
                            placeholder="Title of this scanned letter… (e.g. Handwritten Letter from Paris)"
                            value={scanned.title}
                            onChange={e => setScanned(p => ({ ...p, title: e.target.value }))}
                            className="compose-input-title"
                            required
                        />

                        {/* Dropzone */}
                        <div
                            {...getRootProps()}
                            style={{
                                border: '2px dashed var(--parchment-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '48px 24px',
                                textAlign: 'center',
                                background: isDragActive ? 'var(--parchment-muted)' : 'rgba(0,0,0,0.01)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <input {...getInputProps()} />
                            <div style={{ fontSize: 52, marginBottom: 12 }}>📷</div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                                {file ? file.name : 'Upload your handwritten letter or sketch'}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                                Drag & drop or click to upload PNG, JPG, or PDF (up to 10MB)
                            </p>
                        </div>

                        {/* Preview */}
                        {preview && (
                            <div style={{ marginTop: 24, textAlign: 'center' }}>
                                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-muted)', marginBottom: 8, fontWeight: 700 }}>
                                    Letter Scan Preview:
                                </div>
                                <img
                                    src={preview}
                                    alt="Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: 400,
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--parchment-border)',
                                        boxShadow: 'var(--shadow-md)',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Delivery Date Selection Card */}
                    <div style={{
                        background: 'var(--parchment-surface)',
                        border: '1px solid var(--parchment-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '28px 32px',
                        marginTop: '28px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 4 }}>
                            When Should This Letter Arrive?
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 14 }}>
                            Select a preset duration or pick an exact calendar date.
                        </p>

                        <div className="date-preset-grid">
                            {PRESET_OPTIONS.map(opt => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    className={`date-preset-btn ${activePreset === opt.label ? 'active' : ''}`}
                                    onClick={() => handlePresetClick(opt.years, opt.months, opt.label)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" htmlFor="scanned-deliver-at">Exact Delivery Date & Time</label>
                            <input
                                id="scanned-deliver-at"
                                type="datetime-local"
                                className="form-input"
                                min={minDate}
                                value={scanned.deliverAt}
                                onChange={e => {
                                    setActivePreset('')
                                    setScanned(p => ({ ...p, deliverAt: e.target.value }))
                                }}
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ marginTop: 32, textAlign: 'center' }}>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ minWidth: 260, fontSize: 16 }}
                            disabled={loading || !file}
                        >
                            {loading ? <><span className="spinner" /> Uploading & Sealing…</> : '📷 Preserve and Seal Handwritten Letter'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
