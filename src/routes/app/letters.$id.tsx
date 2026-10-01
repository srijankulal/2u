import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../components/AuthProvider'
import { useToast } from '../../components/ToastProvider'
import { getLetterByIdFn, deleteLetterFn, rescheduleLetterFn } from '../../server/letters'

interface Letter {
    id: string
    title: string
    content: string | null
    imageUrl: string | null
    type: 'typed' | 'scanned'
    deliverAt: string
    deliveredAt: string | null
    createdAt: string
}

export const Route = createFileRoute('/app/letters/$id')({
    component: LetterDetailPage,
})

function LetterDetailPage() {
    const { id } = Route.useParams()
    const { refreshUser } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [letter, setLetter] = useState<Letter | null>(null)
    const [loading, setLoading] = useState(true)
    const [rescheduling, setRescheduling] = useState(false)
    const [newDate, setNewDate] = useState('')
    const [showReschedule, setShowReschedule] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [now, setNow] = useState(Date.now())
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)

    useEffect(() => {
        getLetterByIdFn({ data: id })
            .then(data => { setLetter(data as Letter); setLoading(false) })
            .catch(() => { showToast('Letter not found', 'error'); setLoading(false) })
    }, [id])

    // Live countdown timer ticker
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to cancel and delete this sealed letter? This cannot be undone.')) return
        setDeleting(true)
        try {
            await deleteLetterFn({ data: id })
            await refreshUser()
            showToast('Letter removed from transit', 'info')
            navigate({ to: '/app' })
        } catch {
            showToast('Could not delete this letter', 'error')
            setDeleting(false)
        }
    }

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDate) return
        setRescheduling(true)
        try {
            const updated = await rescheduleLetterFn({
                data: { id, deliverAt: new Date(newDate).toISOString() }
            })
            setLetter(updated as Letter)
            setShowReschedule(false)
            setNewDate('')
            showToast('Delivery date rescheduled successfully ✓', 'success')
        } catch (err: any) {
            showToast(err?.message || 'Failed to reschedule', 'error')
        } finally {
            setRescheduling(false)
        }
    }

    const countdown = useMemo(() => {
        if (!letter?.deliverAt) return { days: 0, hours: 0, minutes: 0, seconds: 0, isDue: true }
        const target = new Date(letter.deliverAt).getTime()
        const diff = target - now
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isDue: true }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        return { days, hours, minutes, seconds, isDue: false }
    }, [letter?.deliverAt, now])

    const progressPercentage = useMemo(() => {
        if (!letter) return 0
        const start = new Date(letter.createdAt).getTime()
        const end = new Date(letter.deliverAt).getTime()
        const total = end - start
        if (total <= 0) return 100
        const elapsed = now - start
        return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
    }, [letter, now])

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const formatDateTime = (d: string) =>
        new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    const minDate = new Date(Date.now() + 60000).toISOString().slice(0, 16)

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📮</div>
                <h3 className="empty-state-title">Retrieving dispatch archives…</h3>
                <p className="empty-state-sub">Opening the vault for your letter.</p>
            </div>
        )
    }

    if (!letter) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">✉</div>
                <h3 className="empty-state-title">Letter not found</h3>
                <p className="empty-state-sub">This dispatch could not be located or has already completed transit.</p>
                <Link to="/app" className="btn btn-primary" style={{ marginTop: 12 }}>Return to Mailbox →</Link>
            </div>
        )
    }

    const isDelivered = !!letter.deliveredAt

    return (
        <div className="letter-view-container">
            {/* Top Navigation & Controls */}
            <div className="letter-top-controls">
                <Link to="/app" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, color: 'var(--ink-muted)' }}>
                    ← Back to Mailbox
                </Link>

                <div style={{ display: 'flex', gap: 10 }}>
                    {isDelivered && (
                        <button
                            onClick={() => window.print()}
                            className="btn btn-secondary btn-sm"
                            title="Print as Keepsake"
                        >
                            🖨 Print Keepsake
                        </button>
                    )}
                    {!isDelivered && (
                        <>
                            <button
                                onClick={() => setShowReschedule(!showReschedule)}
                                className="btn btn-secondary btn-sm"
                            >
                                📅 Reschedule
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn btn-danger btn-sm"
                                disabled={deleting}
                            >
                                {deleting ? '…' : '🗑 Cancel Letter'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Reschedule Modal / Panel */}
            {showReschedule && !isDelivered && (
                <div style={{
                    background: 'var(--parchment-surface)',
                    border: '1.5px solid var(--parchment-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    marginBottom: '28px',
                    boxShadow: 'var(--shadow-md)',
                }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 6 }}>
                        Reschedule Delivery Date
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 18 }}>
                        Choose a new date in the future for this letter to be delivered to your inbox.
                    </p>
                    <form onSubmit={handleReschedule} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ margin: 0, flex: '1 1 240px' }}>
                            <label className="form-label" htmlFor="reschedule-input">New Delivery Date & Time</label>
                            <input
                                id="reschedule-input"
                                type="datetime-local"
                                className="form-input"
                                min={minDate}
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={rescheduling}>
                            {rescheduling ? 'Sealing…' : '✓ Confirm New Date'}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReschedule(false)}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* ── CASE 1: SEALED LETTER IN TRANSIT ────────────────────────────── */}
            {!isDelivered && (
                <div className="sealed-envelope-hero">
                    <div className="wax-seal-large" title="Sealed with 2U Imperial Postal Wax">
                        <span className="wax-seal-monogram">2U</span>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span className="badge badge-pending">⏳ In Transit & Sealed</span>
                        <span className="badge badge-typed">
                            {letter.type === 'typed' ? '✒ Typed Dispatch' : '📷 Handwritten Scan'}
                        </span>
                    </div>

                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                        {letter.title}
                    </h1>

                    <p style={{ fontSize: 14, color: 'var(--ink-light)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
                        This letter is safely encrypted and sealed in the time vault. It will arrive in your inbox when the time arrives.
                    </p>

                    {/* Live Countdown Grid */}
                    <div className="countdown-box">
                        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--gold-dark)', fontWeight: 700, marginBottom: 16 }}>
                            Time Remaining Until Delivery
                        </div>
                        <div className="countdown-grid">
                            <div className="countdown-item">
                                <span className="countdown-number">{countdown.days}</span>
                                <span className="countdown-unit">Days</span>
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--parchment-border)', alignSelf: 'center' }}>:</div>
                            <div className="countdown-item">
                                <span className="countdown-number">{String(countdown.hours).padStart(2, '0')}</span>
                                <span className="countdown-unit">Hours</span>
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--parchment-border)', alignSelf: 'center' }}>:</div>
                            <div className="countdown-item">
                                <span className="countdown-number">{String(countdown.minutes).padStart(2, '0')}</span>
                                <span className="countdown-unit">Mins</span>
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--parchment-border)', alignSelf: 'center' }}>:</div>
                            <div className="countdown-item">
                                <span className="countdown-number">{String(countdown.seconds).padStart(2, '0')}</span>
                                <span className="countdown-unit">Secs</span>
                            </div>
                        </div>
                    </div>

                    {/* Time-Capsule Journey Progress Bar */}
                    <div style={{ marginTop: 24, textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>
                            <span>Penned: {formatDate(letter.createdAt)}</span>
                            <span>{progressPercentage}% Journey Completed</span>
                            <span>Delivers: {formatDate(letter.deliverAt)}</span>
                        </div>
                        <div className="time-progress-bar" style={{ height: 6 }}>
                            <div className="time-progress-fill" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── CASE 2: DELIVERED LETTER (OPENED STATIONERY EXPERIENCE) ──────── */}
            {isDelivered && (
                <div className="opened-stationery">
                    {/* Header with Vintage Letterhead & Postal Stamp */}
                    <div className="stationery-header">
                        <div>
                            <div className="stationery-brand-crest">
                                <span className="stationery-crest-logo">2U POSTAL ARCHIVE</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 }}>
                                Certified Time-Capsule Delivery
                            </div>
                        </div>

                        <div className="stationery-postmark-stamp">
                            <span style={{ fontSize: 16 }}>✓</span>
                            <span>Delivered</span>
                            <span>{new Date(letter.deliveredAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <h1 className="stationery-title">{letter.title}</h1>

                    <div className="stationery-salutation">
                        Dear future me,
                    </div>

                    {/* Typed letter text */}
                    {letter.type === 'typed' && letter.content && (
                        <div className="stationery-content">
                            {letter.content}
                        </div>
                    )}

                    {/* Scanned handwritten letter */}
                    {letter.type === 'scanned' && letter.imageUrl && (
                        <div>
                            <div className="scanned-image-frame">
                                <img
                                    src={letter.imageUrl}
                                    alt="Scanned handwritten letter"
                                    className="scanned-img"
                                    onClick={() => setIsLightboxOpen(true)}
                                    title="Click to zoom image"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                                <button
                                    onClick={() => setIsLightboxOpen(true)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    🔍 Zoom Fullscreen
                                </button>
                                <a
                                    href={letter.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="btn btn-ghost btn-sm"
                                >
                                    ⬇ Download Original Scan
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Handwritten Valediction Sign-off */}
                    <div className="stationery-valediction">
                        With love from the past,<br />
                        <span style={{ fontSize: 20 }}>
                            — You, {new Date(letter.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    {/* Footer Metadata */}
                    <div className="stationery-footer-bar">
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                            Written on {formatDateTime(letter.createdAt)} · Delivered on {formatDateTime(letter.deliveredAt!)}
                        </div>
                        <div className="badge badge-delivered">
                            ✓ Delivery Verified
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal for Scanned Letters */}
            {isLightboxOpen && letter.imageUrl && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                    }}
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        style={{
                            position: 'absolute',
                            top: 24,
                            right: 24,
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: '#fff',
                            fontSize: 24,
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            cursor: 'pointer',
                        }}
                    >
                        ✕
                    </button>
                    <img
                        src={letter.imageUrl}
                        alt="Zoomed handwritten letter"
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '85vh',
                            objectFit: 'contain',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
