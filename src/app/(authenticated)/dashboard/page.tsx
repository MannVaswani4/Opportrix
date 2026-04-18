'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  collection, query, limit, startAfter, getDocs, where,
  QueryDocumentSnapshot, DocumentData
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { AggregatedPost } from '@/lib/types'
import { platformColor, platformLabel, timeAgo, getInitials, cn } from '@/lib/utils'
import AutoCommentModal from '@/components/AutoCommentModal'
import { Zap, Search, X, ExternalLink, Briefcase } from 'lucide-react'

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
  const { profile } = useAuth()
  const [posts, setPosts]                   = useState<AggregatedPost[]>([])
  const [loading, setLoading]               = useState(true)
  const [loadingMore, setLoadingMore]       = useState(false)
  const [lastDoc, setLastDoc]               = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore]               = useState(false)
  const [platformFilter, setPlatformFilter] = useState('all')
  const platforms = ['all', 'linkedin', 'twitter', 'reddit', 'remoteok', 'remotive']
  const [tab, setTab]                       = useState<'freelance' | 'hiring'>('freelance')
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [showModal, setShowModal]           = useState(false)
  const [filterPlatforms, setFilterPlatforms] = useState<Set<string>>(new Set(['linkedin','twitter','reddit']))
  const [searchTerm, setSearchTerm]         = useState('')
  const [skillFilter, setSkillFilter]       = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  async function fetchPosts(tabVal: 'freelance'|'hiring', after?: QueryDocumentSnapshot<DocumentData>) {
    // Note: compound where+orderBy requires a composite index.
    // We fetch by tab only and sort client-side to avoid the index requirement.
    let q = query(
      collection(db, 'aggregatedPosts'),
      where('tab', '==', tabVal),
      limit(LIMIT)
    )
    if (after) q = query(q, startAfter(after))
    const snap = await getDocs(q)
    // Sort by postedAt descending client-side
    const docs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as AggregatedPost))
      .sort((a, b) => (b.postedAt || 0) - (a.postedAt || 0))
    return { docs, last: snap.docs[snap.docs.length - 1] || null, isEmpty: snap.empty }
  }

  useEffect(() => {
    setLoading(true)
    setPosts([])
    setSelectedIds(new Set())
    fetchPosts(tab).then(({ docs, last, isEmpty }) => {
      setPosts(docs)
      setLastDoc(last)
      setHasMore(!isEmpty && docs.length === LIMIT)
      setLoading(false)
    })
  }, [tab])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return
    setLoadingMore(true)
    const { docs, last, isEmpty } = await fetchPosts(tab, lastDoc)
    setPosts(p => [...p, ...docs])
    setLastDoc(last)
    setHasMore(!isEmpty && docs.length === LIMIT)
    setLoadingMore(false)
  }, [hasMore, loadingMore, lastDoc, tab])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore() }, { threshold: 0.5 })
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

  // Client-side filtering: platform + search + skill tag
  const filteredPosts = posts.filter(p => {
    const matchesPlatform = platformFilter === 'all' || p.platform === platformFilter
    const matchesSkills = !skillFilter || p.skillTags?.some(t => t.toLowerCase() === skillFilter.toLowerCase())
    const matchesSearch = !searchTerm || (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.snippet?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.author.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return matchesPlatform && matchesSkills && matchesSearch
  })

  const selectedPosts = filteredPosts.filter(p => selectedIds.has(p.id))

  // User's own skill tags for filter chips
  const profileSkills = profile?.skills?.slice(0, 8) || []

  return (
    <>
      <div className="flex flex-1 overflow-hidden h-full">
        {/* ── Left filter panel ─────────────────── */}
        <aside className="w-56 shrink-0 px-5 py-6 border-r border-slate-100 hidden lg:flex flex-col gap-6 bg-white">
          {/* Tabs */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-3">FEED TYPE</p>
            <div className="flex flex-col gap-1">
              {(['freelance', 'hiring'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all',
                    tab === t
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  )}
                >
                  {t === 'freelance' ? '🟢 Freelance Gigs' : '🔵 Hiring / Jobs'}
                </button>
              ))}
            </div>
          </div>

          {/* Your skills filter */}
          {profileSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold tracking-widests text-slate-400 mb-3">FILTER BY YOUR SKILLS</p>
              <div className="flex flex-wrap gap-1.5">
                {profileSkills.map(s => (
                  <button
                    key={s}
                    onClick={() => setSkillFilter(skillFilter === s ? null : s)}
                    className={cn(
                      'badge text-xs transition-all font-semibold',
                      skillFilter === s
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                    )}
                  >
                    {s}
                  </button>
                ))}
                {skillFilter && (
                  <button onClick={() => setSkillFilter(null)} className="text-xs text-red-500 hover:underline flex items-center gap-1 mt-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main feed ──────────────────────── */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {/* Title row + search */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {tab === 'freelance' ? 'Freelance Gigs' : 'Hiring Board'}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {tab === 'freelance'
                  ? 'Real-time gig posts from Reddit, LinkedIn, and Twitter filtered to your skills.'
                  : 'Active job openings from companies recruiting on major platforms.'}
              </p>
            </div>

            {/* Search bar */}
            <div className="relative w-72 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 bg-slate-50 text-sm w-full"
                placeholder="Search posts, skills…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active filters summary */}
          {(skillFilter || searchTerm) && (
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
              <span>Filtering:</span>
              {skillFilter && <span className="badge bg-brand-100 text-brand-700">skill: {skillFilter}</span>}
              {searchTerm && <span className="badge bg-slate-100 text-slate-600">query: "{searchTerm}"</span>}
              <button onClick={() => { setSkillFilter(null); setSearchTerm('') }} className="text-red-500 hover:underline text-xs ml-1">
                Clear all
              </button>
            </div>
          )}

          {/* Platform Filters */}
          <div className="card p-5 mb-8 overflow-hidden bg-white/70 backdrop-blur-xl">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {platforms.map(p => (
                 <button
                   key={p}
                   onClick={() => setPlatformFilter(p)}
                   className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                     platformFilter === p ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                   }`}
                 >
                   {p}
                 </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {loading ? (
              Array(5).fill(0).map((_, i) => <PostSkeleton key={i} />)
            ) : filteredPosts.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 border border-slate-200">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-bold text-slate-800 mb-2">No Matching Posts Found</p>
                <p className="text-sm">Try broadening your search or adjusting skill filters.</p>
              </div>
            ) : filteredPosts.map(post => (
              <div
                key={post.id}
                className={cn(
                  'card p-7 transition-all duration-300 flex items-start gap-5 relative overflow-hidden bg-white/60 backdrop-blur-sm border',
                  selectedIds.has(post.id) ? 'ring-2 ring-brand-500 border-transparent shadow-lg shadow-brand-500/10 -translate-y-1' : 'border-slate-200/60 hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-300/40 hover:-translate-y-1'
                )}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-brand-500 transition-colors" />
                <div className="pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(post.id)}
                    onChange={() => togglePost(post.id)}
                    className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-5 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-700 font-bold text-lg shrink-0">
                      {getInitials((post.author || 'Anonymous').replace(/^u\//i, ''))}
                    </div>
                    <div>
                      <span className="font-extrabold text-lg text-slate-900 block leading-tight tracking-tight">{(post.author || 'Anonymous').replace(/^u\//i, '')}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border shadow-sm bg-black text-white">
                          {platformLabel(post.platform)}
                        </span>
                        {post.authorHandle && <span className="text-slate-400 text-xs font-medium">({post.authorHandle})</span>}
                        <span className="text-xs text-slate-400 font-medium">· {timeAgo(post.postedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug tracking-tight hover:text-brand-700 transition-colors cursor-pointer">{post.title}</h3>

                  {/* Snippet */}
                  <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-3 mb-4">{post.snippet}</p>

                  {/* Skill tags */}
                  {post.skillTags && post.skillTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.skillTags.slice(0, 5).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSkillFilter(skillFilter === tag ? null : tag)}
                          className={cn(
                            'px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm transition-all',
                            skillFilter === tag ? 'bg-brand-600 border-brand-600 text-white shadow-md' : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-white hover:border-brand-300 hover:text-brand-600'
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View original link */}
                  <div className="pt-4 mt-2 border-t border-slate-100/80">
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" /> View Original Post
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className="py-4 text-center">
              {loadingMore && <p className="text-xs text-slate-400 animate-pulse tracking-widest">LOADING MORE…</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Auto-comment CTA */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3.5 rounded-2xl shadow-xl shadow-brand-200 transition-all duration-200 hover:scale-105"
          >
            <Zap className="w-5 h-5" />
            Auto-Comment ({selectedIds.size} selected)
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
