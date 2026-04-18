'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  collection, query, orderBy, limit, startAfter, getDocs, where,
  QueryDocumentSnapshot, DocumentData
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { AggregatedPost } from '@/lib/types'
import { platformColor, platformLabel, timeAgo, cn } from '@/lib/utils'
import AutoCommentModal from '@/components/AutoCommentModal'
import { Bell, Settings, Search, Zap, SlidersHorizontal, X } from 'lucide-react'

const PLATFORMS = ['linkedin', 'twitter', 'reddit'] as const
const LIMIT = 20

function PostSkeleton() {
  return (
    <div className="post-card animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="skeleton w-20 h-5 rounded-full" />
        <div className="skeleton w-24 h-5 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-4 w-1/2 mb-4" />
      <div className="skeleton h-12 w-full mb-3" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts]               = useState<AggregatedPost[]>([])
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [lastDoc, setLastDoc]           = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore]           = useState(true)
  const [tab, setTab]                   = useState<'freelance' | 'hiring'>('freelance')
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set())
  const [showModal, setShowModal]       = useState(false)
  const [filterPlatforms, setFilterPlatforms] = useState<Set<string>>(new Set(['linkedin','twitter','reddit']))
  const [searchTerm, setSearchTerm]     = useState('')
  const loaderRef = useRef<HTMLDivElement>(null)

  async function fetchPosts(after?: QueryDocumentSnapshot<DocumentData>) {
    let q = query(
      collection(db, 'aggregatedPosts'),
      orderBy('postedAt', 'desc'),
      limit(LIMIT)
    )
    if (after) q = query(q, startAfter(after))

    const snap = await getDocs(q)
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AggregatedPost))
    return { docs, last: snap.docs[snap.docs.length - 1] || null, isEmpty: snap.empty }
  }

  useEffect(() => {
    setLoading(true)
    fetchPosts().then(({ docs, last, isEmpty }) => {
      setPosts(docs)
      setLastDoc(last)
      setHasMore(!isEmpty && docs.length === LIMIT)
      setLoading(false)
    })
  }, [tab])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return
    setLoadingMore(true)
    const { docs, last, isEmpty } = await fetchPosts(lastDoc)
    setPosts(p => [...p, ...docs])
    setLastDoc(last)
    setHasMore(!isEmpty && docs.length === LIMIT)
    setLoadingMore(false)
  }, [hasMore, loadingMore, lastDoc])

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMore() }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  function togglePost(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function togglePlatform(p: string) {
    setFilterPlatforms(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  const filteredPosts = posts.filter(p =>
    filterPlatforms.has(p.platform) &&
    (searchTerm === '' || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.snippet?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedPosts = filteredPosts.filter(p => selectedIds.has(p.id))

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9 bg-slate-50 text-sm"
            placeholder="Search for jobs, skills, or platforms…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Bell className="w-5 h-5 text-slate-400 ml-auto cursor-pointer hover:text-slate-700" />
        <Settings className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
            {profile?.fullName?.[0] || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-800">{profile?.fullName || 'User'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{profile?.headline || 'Pro Freelancer'}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left filters */}
        <aside className="w-52 shrink-0 px-4 py-6 border-r border-slate-100 hidden lg:block">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-3">SOURCES</p>
          <div className="space-y-2 mb-6">
            {PLATFORMS.map(p => (
              <label key={p} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filterPlatforms.has(p)}
                  onChange={() => togglePlatform(p)}
                  className="w-3.5 h-3.5 accent-brand-600 rounded"
                />
                <span className={cn('w-2 h-2 rounded-full', platformColor(p).split(' ')[0])} />
                <span className="text-sm text-slate-600 capitalize group-hover:text-slate-900">{
                  p === 'twitter' ? 'Twitter / X' : p.charAt(0).toUpperCase() + p.slice(1)
                }</span>
              </label>
            ))}
          </div>

          <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-3">SKILLS</p>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {(profile?.skills?.slice(0, 6) || ['React','Python','UI Design']).map(s => (
              <span key={s} className="badge bg-brand-50 text-brand-700 text-xs">{s}</span>
            ))}
          </div>

          <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-3">BUDGET RANGE</p>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>$0</span><span className="text-brand-600 font-semibold">$3k+</span>
          </div>
          <input type="range" min={0} max={10000} defaultValue={3000} className="w-full accent-brand-600" />
        </aside>

        {/* Main feed */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Aggregated Feed</h1>
              <p className="text-sm text-slate-400 mt-0.5">Monitoring real-time sources for your selected skills.</p>
            </div>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {(['freelance','hiring'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn('px-5 py-2 text-sm font-semibold capitalize transition-colors', tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white')}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {loading ? (
              Array(5).fill(0).map((_, i) => <PostSkeleton key={i} />)
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p className="text-lg font-medium mb-2">No posts found</p>
                <p className="text-sm">Try adjusting your filters or wait for the next feed refresh.</p>
              </div>
            ) : filteredPosts.map(post => (
              <div
                key={post.id}
                className={cn('post-card flex gap-4', selectedIds.has(post.id) ? 'border-brand-300 bg-brand-50/30' : '')}
              >
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(post.id)}
                    onChange={() => togglePost(post.id)}
                    className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={cn('badge text-[10px] font-bold uppercase tracking-wide px-2 py-1 flex items-center gap-1', platformColor(post.platform))}>
                      {platformLabel(post.platform)}
                    </span>
                    <span className="text-xs text-slate-400">· {timeAgo(post.postedAt)}</span>
                    {post.budgetMin && (
                      <span className="ml-auto badge bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">
                        ${post.budgetMin.toLocaleString()} – ${post.budgetMax?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{post.title}</h3>
                  <p className="text-xs text-slate-400 mb-2">
                    <span className="font-medium text-slate-600">{post.author}</span>{' '}
                    {post.platform === 'reddit' ? 'posted in community' : post.platform === 'linkedin' ? 'posted a new opportunity' : 'shared a thread'}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">{post.snippet}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.skillTags?.slice(0,4).map(tag => (
                      <span key={tag} className="badge bg-slate-100 text-slate-600 text-xs">{tag}</span>
                    ))}
                  </div>
                  <a href={post.postUrl} target="_blank" rel="noopener noreferrer"
                    className="text-brand-600 text-xs mt-2 inline-block hover:underline">
                    View original post →
                  </a>
                </div>
              </div>
            ))}

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="py-4 text-center">
              {loadingMore && <p className="text-xs text-slate-400 animate-pulse tracking-widest">SCANNING FOR MORE JOBS…</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Auto-comment bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3.5 rounded-2xl shadow-xl shadow-brand-200 transition-all duration-200 hover:scale-105"
          >
            <Zap className="w-5 h-5" />
            Auto-comment Selected ({selectedIds.size})
          </button>
        </div>
      )}

      {showModal && (
        <AutoCommentModal
          selectedPosts={selectedPosts}
          onClose={() => { setShowModal(false); setSelectedIds(new Set()) }}
        />
      )}
    </>
  )
}
