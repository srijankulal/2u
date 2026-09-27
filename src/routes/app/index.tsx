import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../components/AuthProvider'
import { useToast } from '../../components/ToastProvider'
import { getLettersFn, deleteLetterFn } from '../../server/letters'

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

export const Route = createFileRoute('/app/')({
    component: DashboardPage,
})

function DashboardPage() {
    const { user, refreshUser } = useAuth()
    const { showToast } = useToast()
    const [letters, setLetters] = useState<Letter[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState<'all' | 'sealed' | 'delivered' | 'typed' | 'scanned'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchLetters = async () => {
        try {
            const data = await getLettersFn()
            setLetters(data as Letter[])
        } catch {
            showToast('Failed to load letters', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchLetters() }, [])

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm('Cancel and delete this sealed letter? This cannot be undone.')) return
        try {
            await deleteLetterFn({ data: id })
            setLetters(prev => prev.filter(l => l.id !== id))
            await refreshUser()
            showToast('Letter deleted', 'info')
        } catch {
            showToast('Could not delete — letter may already be delivered', 'error')
        }
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

    const daysUntil = (d: string) => {
        const diff = new Date(d).getTime() - Date.now()
        const days = Math.ceil(diff / 86400000)
        if (days < 0) return 'Delivered'
        if (days === 0) return 'Arrives Today!'
        if (days === 1) return 'Arrives Tomorrow'
        return `${days} days remaining`
    }

    const pending = useMemo(() => letters.filter(l => !l.deliveredAt), [letters])
    const delivered = useMemo(() => letters.filter(l => !!l.deliveredAt), [letters])

    const nextUpcoming = useMemo(() => {
        if (pending.length === 0) return null
        return [...pending].sort((a, b) => new Date(a.deliverAt).getTime() - new Date(b.deliverAt).getTime())[0]
    }, [pending])

    const filteredLetters = useMemo(() => {
        return letters.filter(letter => {
            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchesTitle = letter.title.toLowerCase().includes(q)
                const matchesContent = letter.content?.toLowerCase().includes(q)
                if (!matchesTitle && !matchesContent) return false
            }

            // Tab filter
            if (activeFilter === 'sealed') return !letter.deliveredAt
            if (activeFilter === 'delivered') return !!letter.deliveredAt
            if (activeFilter === 'typed') return letter.type === 'typed'
            if (activeFilter === 'scanned') return letter.type === 'scanned'
            return true
        })
    }, [letters, activeFilter, searchQuery])

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📮</div>
                <h3 className="empty-state-title">Opening the postal vault…</h3>
                <p className="empty-state-sub">Gathering all your time-capsule letters.</p>
            </div>
        )
    }

    return (
        <div>
            {/* Top Greeting & Stats Overview */}
            <div className="dashboard-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 6 }}>
                        Welcome back, {user?.name?.split(' ')[0] || 'Friend'}
                    </h1>
                    <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
                        Your vault & sealed letters.
                    </p>
                </div>

                <Link to="/app/compose" className="btn btn-primary btn-lg">
                    ✏️ Write a New Letter
                </Link>
            </div>

            {/* Stats Overview Bar */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-icon">
                        ⏳
                    </div>
                    <div>
                        <div className="stat-val">{pending.length}</div>
                        <div className="stat-lbl">Sealed in Transit</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        📬
                    </div>
                    <div>
                        <div className="stat-val">{delivered.length}</div>
                        <div className="stat-lbl">Delivered Letters</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        📮
                    </div>
                    <div>
                        <div className="stat-val">{user?.slotsFree ?? 5} / 5</div>
                        <div className="stat-lbl">Slots Available</div>
                    </div>
                </div>

                {nextUpcoming && (
                    <div className="stat-card" style={{ borderLeft: '2px solid var(--border)' }}>
                        <div className="stat-icon">
                            📅
                        </div>
                        <div>
                            <div className="stat-val" style={{ fontSize: 18 }}>{formatDate(nextUpcoming.deliverAt)}</div>
                            <div className="stat-lbl">Next Delivery Date</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter and Search Bar */}
            {letters.length > 0 && (
                <div className="filter-bar">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            All ({letters.length})
                        </button>
                        <button
                            className={`filter-tab ${activeFilter === 'sealed' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('sealed')}
                        >
                            ⏳ Sealed ({pending.length})
                        </button>
                        <button
                            className={`filter-tab ${activeFilter === 'delivered' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('delivered')}
                        >
                            📬 Delivered ({delivered.length})
                        </button>
                    </div>

                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search your letters…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>
            )}

            {/* Main Letter Grid or Empty State */}
            {letters.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✉</div>
                    <h2 className="empty-state-title">Your postal vault is empty</h2>
                    <p className="empty-state-sub">
                        Send a message across time. Write a heartfelt letter to your future self, seal it, and experience the magic of rediscovering it months or years from today.
                    </p>
                    <Link to="/app/compose" className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
                        ✏️ Write Your First Letter
                    </Link>

                    <div style={{ marginTop: 32 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', marginBottom: 12, fontWeight: 500 }}>
                            Need inspiration?
                        </div>
                        <div className="prompt-chips">
                            <span className="prompt-chip">"Where will I be in 5 years?"</span>
                            <span className="prompt-chip">"What am I most proud of today?"</span>
                            <span className="prompt-chip">"A message for my future birthday"</span>
                            <span className="prompt-chip">"My current biggest dreams & fears"</span>
                        </div>
                    </div>
                </div>
            ) : filteredLetters.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px 24px' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <h3 className="empty-state-title">No letters match your filter</h3>
                    <p className="empty-state-sub">Try changing your search query or filter category.</p>
                    <button onClick={() => { setActiveFilter('all'); setSearchQuery('') }} className="btn btn-secondary btn-sm">
                        Reset Filters
                    </button>
                </div>
            ) : (
                <div className="letter-grid">
                    {filteredLetters.map(letter => {
                        const isDelivered = !!letter.deliveredAt
                        const start = new Date(letter.createdAt).getTime()
                        const end = new Date(letter.deliverAt).getTime()
                        const total = end - start
                        const elapsed = Date.now() - start
                        const progress = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 100

                        return (
                            <Link
                                key={letter.id}
                                to="/app/letters/$id"
                                params={{ id: letter.id }}
                                className={`envelope-card ${isDelivered ? 'delivered' : ''}`}
                            >
                                <div className="envelope-flap-header" />
                                <div className={`envelope-seal-mini ${isDelivered ? 'delivered' : ''}`}>
                                    {isDelivered ? '✓' : '2U'}
                                </div>

                                <div className="envelope-card-body">
                                    <div className="envelope-postmark">
                                        <div className="postal-stamp-badge">
                                            <span>{letter.type === 'typed' ? '✒ Typed' : '📷 Scanned'}</span>
                                        </div>
                                        <span className={`badge ${isDelivered ? 'badge-delivered' : 'badge-pending'}`}>
                                            {isDelivered ? '✓ Delivered' : daysUntil(letter.deliverAt)}
                                        </span>
                                    </div>

                                    <h3 className="envelope-card-title">{letter.title}</h3>

                                    {letter.content && (
                                        <p className="envelope-card-preview">{letter.content}</p>
                                    )}
                                    {letter.type === 'scanned' && !letter.content && (
                                        <p className="envelope-card-preview" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                                            📷 Handwritten letter scan attached
                                        </p>
                                    )}

                                    {!isDelivered && (
                                        <div className="envelope-time-progress">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                                                <span>{formatDate(letter.createdAt)}</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="time-progress-bar">
                                                <div className="time-progress-fill" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="envelope-card-footer">
                                        <div className="envelope-date-label">
                                            <span>📅</span>
                                            <span>
                                                {isDelivered
                                                    ? `Opened ${formatDate(letter.deliveredAt!)}`
                                                    : `Delivers: ${formatDate(letter.deliverAt)}`
                                                }
                                            </span>
                                        </div>

                                        {!isDelivered && (
                                            <button
                                                onClick={e => handleDelete(letter.id, e)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                    color: 'var(--ink-3)',
                                                    padding: '4px',
                                                    opacity: 0.6,
                                                    transition: 'opacity 0.15s',
                                                }}
                                                onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                                                onMouseOut={e => (e.currentTarget.style.opacity = '0.6')}
                                                title="Cancel & delete letter"
                                            >
                                                🗑
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
