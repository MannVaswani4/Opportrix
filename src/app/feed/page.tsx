'use client'
import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, limit, onSnapshot, addDoc, where,
  updateDoc, doc, arrayUnion, arrayRemove, getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { NativePost, NativePostComment } from '@/lib/types'
import { timeAgo, getInitials, cn } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ThumbsUp, MessageCircle, Share2, Image, FileText,
  Search, TrendingUp, Star, Zap, LayoutDashboard,
  Briefcase, Users, MessageSquare, Bell, Settings
} from 'lucide-react'

const POST_TYPES = ['All','Jobs','Portfolios','Tips'] as const

function PostCard({ post, onOpen }: { post: NativePost; onOpen: () => void }) {
  const { user } = useAuth()
  const liked = user ? post.likes.includes(user.uid) : false

  async function toggleLike() {
    if (!user) return
    await updateDoc(doc(db, 'nativePosts', post.id), {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    })
  }

  return (
    <div className="card p-5 hover:shadow-sm transition-shadow cursor-pointer" onClick={onOpen}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {getInitials(post.userDisplayName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 text-sm">{post.userDisplayName}</p>
            <span className={cn('badge text-[10px] uppercase font-bold tracking-wide px-2 py-0.5',
              post.userRole === 'recruiter' ? 'bg-purple-50 text-purple-700' : 'bg-brand-50 text-brand-700')}>
              {post.userRole}
            </span>
          </div>
          <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-line line-clamp-4">{post.content}</p>
      <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
        <button onClick={e => { e.stopPropagation(); toggleLike() }}
          className={cn('flex items-center gap-1.5 text-sm transition-colors', liked ? 'text-brand-600 font-medium' : 'text-slate-400 hover:text-slate-600')}>
          <ThumbsUp className="w-4 h-4" /> {post.likes.length}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          <MessageCircle className="w-4 h-4" /> {post.commentCount}
        </button>
        {post.userRole === 'recruiter' && post.postType === 'job' && (
          <button className="ml-auto text-brand-600 text-xs font-bold hover:underline">APPLY NOW</button>
        )}
        <button onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors ml-auto">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts]           = useState<NativePost[]>([])
  const [filterType, setFilterType] = useState<string>('All')
  const [composing, setComposing]   = useState('')
  const [postType, setPostType]     = useState<'job'|'portfolio'|'tips'>('tips')
  const [posting, setPosting]       = useState(false)
  const [openPost, setOpenPost]     = useState<NativePost | null>(null)
  const [comments, setComments]     = useState<NativePostComment[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    let q = query(collection(db, 'nativePosts'), orderBy('createdAt','desc'), limit(30))
    if (filterType !== 'All') {
      q = query(collection(db,'nativePosts'), where('postType','==',filterType.toLowerCase().replace('portfolios','portfolio').replace('tips','tips').replace('jobs','job')), orderBy('createdAt','desc'), limit(30))
    }
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as NativePost)))
    })
    return unsub
  }, [filterType])

  useEffect(() => {
    if (!openPost) return
    const q = query(collection(db,'nativePostComments'), where('postId','==',openPost.id), orderBy('createdAt','asc'))
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as NativePostComment))
      )
    })
    return unsub
  }, [openPost])

  async function handlePost() {
    if (!composing.trim() || !user || !profile) return
    setPosting(true)
    try {
      await addDoc(collection(db, 'nativePosts'), {
        userId: user.uid,
        userDisplayName: profile.fullName,
        userRole: profile.role,
        content: composing,
        postType,
        likes: [],
        commentCount: 0,
        createdAt: Date.now(),
      })
      setComposing('')
      toast.success('Post published!')
    } catch { toast.error('Failed to post') }
    setPosting(false)
  }

  async function handleComment() {
    if (!newComment.trim() || !user || !profile || !openPost) return
    await addDoc(collection(db,'nativePostComments'), {
      postId: openPost.id,
      userId: user.uid,
      userDisplayName: profile.fullName,
      content: newComment,
      createdAt: Date.now(),
    })
    await updateDoc(doc(db,'nativePosts',openPost.id), { commentCount: (openPost.commentCount || 0) + 1 })
    setNewComment('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 h-14 flex items-center gap-6">
        <Link href="/" className="text-brand-600 font-bold text-lg">Opportrix</Link>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 py-2 text-sm bg-slate-50" placeholder="Search Opportrix…" />
        </div>
        <div className="flex items-center gap-6 ml-auto">
          {[{label:'Feed',href:'/feed'},{label:'Network',href:'#'},{label:'Academy',href:'#'}].map(l => (
            <Link key={l.label} href={l.href} className={cn('text-sm font-medium transition-colors', l.label==='Feed' ? 'text-brand-600 border-b-2 border-brand-600 pb-1' : 'text-slate-500 hover:text-slate-800')}>
              {l.label}
            </Link>
          ))}
        </div>
        <Bell className="w-5 h-5 text-slate-400 cursor-pointer" />
        <Settings className="w-5 h-5 text-slate-400 cursor-pointer" />
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
          {getInitials(profile?.fullName || 'U')}
        </div>
      </nav>

      <div className="flex max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        {/* Left sidebar */}
        <aside className="w-48 shrink-0 hidden lg:block">
          <nav className="space-y-0.5">
            {[
              { label:'Dashboard', icon:LayoutDashboard, href: profile?.role === 'recruiter' ? '/recruiter' : '/dashboard' },
              { label:'Job Board', icon:Briefcase, href:'/dashboard/jobs' },
              { label:'Talent Pool', icon:Users, href:'/recruiter' },
              { label:'Messages', icon:MessageSquare, href:'/chat' },
            ].map(n => (
              <Link key={n.label} href={n.href} className="nav-item">
                <n.icon className="w-4 h-4" />{n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-3">TRENDING TOPICS</p>
            {['#RemoteFirst2024','#DesignSystems','#FreelanceTaxTips'].map((t,i) => (
              <div key={t} className="mb-3">
                <p className="text-sm font-semibold text-slate-700 hover:text-brand-600 cursor-pointer">{t}</p>
                <p className="text-xs text-slate-400">{[2.4,1.8,0.95][i]}k posts this week</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Center feed */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Compose box */}
          <div className="card p-5">
            <div className="flex gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold shrink-0">
                {getInitials(profile?.fullName || 'U')}
              </div>
              <textarea
                className="input resize-none h-20 flex-1"
                placeholder={`What's on your mind, ${profile?.fullName?.split(' ')[0] || 'there'}?`}
                value={composing}
                onChange={e => setComposing(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPostType('portfolio')} className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors', postType==='portfolio' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50')}>
                <Image className="w-4 h-4" /> Media
              </button>
              <button onClick={() => setPostType('tips')} className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors', postType==='tips' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50')}>
                <FileText className="w-4 h-4" /> Article
              </button>
              <button onClick={() => setPostType('job')} className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors', postType==='job' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50')}>
                <Briefcase className="w-4 h-4" /> Job
              </button>
              <button onClick={handlePost} disabled={!composing.trim() || posting} className="btn-primary ml-auto text-sm px-5 py-2">
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {POST_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors', filterType === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300')}>
                {t}
              </button>
            ))}
          </div>

          {posts.map(post => (
            <PostCard key={post.id} post={post} onOpen={() => setOpenPost(post)} />
          ))}
        </div>

        {/* Right sidebar */}
        <aside className="w-56 shrink-0 hidden xl:block space-y-5">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-widest text-slate-400">TOP FREELANCERS</p>
              <a href="#" className="text-xs text-brand-600 font-medium">This Week</a>
            </div>
            {[
              { name: 'David Kim', role: 'Fullstack Developer', stars: 4.9 },
              { name: 'Sarah J. Miller', role: 'Brand Strategist', stars: 4.8 },
              { name: 'Leo Thompson', role: 'AI Engineer', stars: 4.8 },
            ].map((f, i) => (
              <div key={f.name} className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 font-bold text-sm w-4">{i+1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(f.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{f.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{f.role}</p>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="text-xs font-bold text-slate-700">{f.stars}</span>
                </div>
              </div>
            ))}
            <button className="btn-secondary w-full justify-center text-xs py-2">View All Rankings</button>
          </div>

          <div className="card p-4">
            <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">PLATFORM ACTIVITY</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[{label:'NEW JOBS',val:'428',change:'+12%'},{label:'MATCHES',val:'1,052',change:'+8%'}].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[9px] font-bold tracking-wide text-slate-400">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{s.val}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{s.change}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Active Gigs</span><span className="font-semibold text-brand-600">84%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full" style={{ width: '84%' }} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Post drawer */}
      {openPost && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={() => setOpenPost(null)}>
          <div className="bg-black/30 absolute inset-0" />
          <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl p-6 flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpenPost(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-2xl">×</button>
            <div className="flex gap-3 items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                {getInitials(openPost.userDisplayName)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{openPost.userDisplayName}</p>
                <p className="text-xs text-slate-400">{timeAgo(openPost.createdAt)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-6 whitespace-pre-line flex-1">{openPost.content}</p>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-3">COMMENTS</p>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {getInitials(c.userDisplayName)}
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                      <p className="text-xs font-semibold text-slate-800">{c.userDisplayName}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input text-sm flex-1" placeholder="Add a comment…" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
                <button onClick={handleComment} className="btn-primary px-3 py-2 text-sm">Post</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
