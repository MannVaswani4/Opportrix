'use client'
import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, limit, onSnapshot, addDoc, where,
  updateDoc, doc, arrayUnion, arrayRemove, getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { NativePost, NativePostComment, UserProfile } from '@/lib/types'
import { timeAgo, getInitials, cn } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ThumbsUp, MessageCircle, Share2, Image, FileText,
  Briefcase, Star
} from 'lucide-react'

// Render individual post
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
    <div className="card p-5 hover:border-brand-300 transition-colors cursor-pointer group" onClick={onOpen}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold shrink-0">
          {getInitials(post.userDisplayName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{post.userDisplayName}</p>
            <span className={cn('badge text-[10px] uppercase font-bold tracking-widest px-2 py-0.5',
              post.userRole === 'recruiter' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700')}>
              {post.userRole}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Shared a {post.postType} • {timeAgo(post.createdAt)}</p>
        </div>
      </div>
      <p className="text-[15px] text-slate-700 leading-relaxed mb-6 whitespace-pre-line line-clamp-4">{post.content}</p>
      
      <div className="flex items-center gap-6 pt-4 border-t border-slate-100 text-slate-400">
        <button onClick={e => { e.stopPropagation(); toggleLike() }}
          className={cn('flex items-center gap-2 text-sm font-semibold transition-colors', liked ? 'text-brand-600' : 'hover:text-slate-700')}>
          <ThumbsUp className="w-4 h-4" /> {post.likes.length}
        </button>
        <button className="flex items-center gap-2 text-sm font-semibold hover:text-slate-700 transition-colors">
          <MessageCircle className="w-4 h-4" /> {post.commentCount}
        </button>
        
        <button onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-sm font-semibold hover:text-slate-700 transition-colors ml-auto">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts]           = useState<NativePost[]>([])
  const [composing, setComposing]   = useState('')
  const [postType, setPostType]     = useState<'job'|'portfolio'|'tips'>('tips')
  const [posting, setPosting]       = useState(false)
  const [openPost, setOpenPost]     = useState<NativePost | null>(null)
  const [comments, setComments]     = useState<NativePostComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [topUsers, setTopUsers]     = useState<UserProfile[]>([])

  useEffect(() => {
    if (!profile) return
    
    // Role-based feed filtering logic
    let q;
    if (profile.role === 'recruiter') {
       // Recruiters want to see portfolios and candidate tips
       q = query(collection(db,'nativePosts'), where('postType', 'in', ['portfolio', 'tips']), orderBy('createdAt','desc'), limit(30))
    } else {
       // Freelancers want to see jobs locally posted, and networking tips
       q = query(collection(db,'nativePosts'), where('postType', 'in', ['job', 'tips']), orderBy('createdAt','desc'), limit(30))
    }
    
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as NativePost)))
    })
    return unsub
  }, [profile])
  
  useEffect(() => {
     // Replace dummy right sidebar data with real top freelancers
     async function fetchTopFreelancers() {
        if(!user) return
        const sq = query(collection(db, 'users'), where('role', '==', 'freelancer'), limit(5))
        const d = await getDocs(sq)
        setTopUsers(d.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)).sort((a,b) => (b.atsScore || 0) - (a.atsScore || 0)))
     }
     fetchTopFreelancers()
  }, [user])

  useEffect(() => {
    if (!openPost) return
    const cq = query(collection(db,'nativePostComments'), where('postId','==',openPost.id), orderBy('createdAt','asc'))
    const unsub = onSnapshot(cq, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as NativePostComment)))
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
    <div className="flex justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
       {/* Center feed column */}
       <div className="flex-1 max-w-2xl min-w-0 space-y-6">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Community Feed</h1>
            <p className="text-slate-500 mt-1">
               {profile?.role === 'recruiter' ? 'Discover candidate portfolios and insights.' : 'Network, learn, and grow with peers.'}
            </p>
          </div>

          {/* Compose box */}
          <div className="card p-6 border-brand-100/50 shadow-sm">
            <div className="flex gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 shadow-inner border border-slate-200">
                {getInitials(profile?.fullName || 'U')}
              </div>
              <textarea
                className="input resize-none h-24 flex-1 text-[15px] p-4 bg-slate-50 shadow-inner rounded-xl focus:bg-white"
                placeholder={profile?.role === 'recruiter' ? "Share hiring needs or industry tips..." : "Showcase your portfolio, latest learning, or ask for advice..."}
                value={composing}
                onChange={e => setComposing(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 tracking-widest mr-2 uppercase block hidden sm:block">Post Type:</span>
              <button onClick={() => setPostType('portfolio')} className={cn('flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all border', postType==='portfolio' ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50')}>
                <Image className="w-4 h-4" /> Portfolio
              </button>
              <button onClick={() => setPostType('tips')} className={cn('flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all border', postType==='tips' ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50')}>
                <FileText className="w-4 h-4" /> Tips
              </button>
              {profile?.role === 'recruiter' && (
                <button onClick={() => setPostType('job')} className={cn('flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all border', postType==='job' ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50')}>
                  <Briefcase className="w-4 h-4" /> Job
                </button>
              )}
              
              <button onClick={handlePost} disabled={!composing.trim() || posting} className="btn-primary ml-auto text-sm px-6 py-2.5">
                {posting ? 'Posting…' : 'Share to Network'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
             {posts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                   <p className="text-slate-500 font-medium">No posts in your network yet. Be the first!</p>
                </div>
             ) : posts.map(post => <PostCard key={post.id} post={post} onOpen={() => setOpenPost(post)} />)}
          </div>
       </div>

       {/* Right Sidebar */}
       <aside className="w-80 shrink-0 hidden xl:block space-y-6 pt-16">
          <div className="card p-5">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 mb-6 uppercase">Top Candidates (Live)</h3>
            <div className="space-y-4">
              {topUsers.length === 0 ? (
                 <p className="text-xs text-slate-400">Loading live data...</p>
              ) : topUsers.map((f, i) => (
                <div key={f.uid} className="flex items-center gap-3">
                  <span className="text-slate-300 font-bold text-sm w-4">{i+1}</span>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold shadow-sm border border-slate-200">
                    {getInitials(f.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{f.fullName}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{f.headline || 'Developer'}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md text-amber-700">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                    <span className="text-xs font-bold">{f.atsScore || 85}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
       </aside>

       {/* Post drawer */}
       {openPost && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={() => setOpenPost(null)}>
          <div className="bg-slate-900/40 backdrop-blur-sm absolute inset-0" />
          <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
               <h2 className="font-bold text-lg text-slate-900">Post Thread</h2>
               <button onClick={() => setOpenPost(null)} className="text-slate-400 hover:text-slate-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">×</button>
            </div>
            
            <div className="p-6">
               <div className="flex gap-4 items-start mb-6">
                 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shadow-sm border border-slate-200 shrink-0">
                   {getInitials(openPost.userDisplayName)}
                 </div>
                 <div>
                   <p className="font-bold text-slate-900 text-lg">{openPost.userDisplayName}</p>
                   <p className="text-xs font-semibold text-brand-600 tracking-wider uppercase mb-0.5">{openPost.userRole}</p>
                   <p className="text-xs text-slate-400">{timeAgo(openPost.createdAt)}</p>
                 </div>
               </div>
               <p className="text-[15px] text-slate-700 leading-relaxed mb-8 whitespace-pre-line flex-1 bg-slate-50 p-6 rounded-2xl">{openPost.content}</p>
               
               <div className="border-t border-slate-100 pt-6">
                 <p className="text-xs font-bold tracking-widest text-slate-400 mb-6 uppercase flex items-center gap-2"><MessageCircle className="w-4 h-4"/> Comments ({openPost.commentCount})</p>
                 <div className="space-y-5 mb-8">
                   {comments.map(c => (
                     <div key={c.id} className="flex gap-4 group">
                       <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                         {getInitials(c.userDisplayName)}
                       </div>
                       <div className="flex-1">
                         <div className="flex items-baseline gap-2 mb-1">
                           <p className="text-sm font-bold text-slate-900">{c.userDisplayName}</p>
                           <p className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</p>
                         </div>
                         <p className="text-sm text-slate-600 leading-relaxed">{c.content}</p>
                       </div>
                     </div>
                   ))}
                 </div>
                 <div className="flex gap-3 items-end sticky bottom-6 bg-white pt-2">
                   <textarea className="input text-sm flex-1 resize-none h-14" placeholder="Draft a thoughtful reply..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => {if(e.key==='Enter'&&!e.shiftKey) {e.preventDefault(); handleComment()}}} />
                   <button onClick={handleComment} disabled={!newComment.trim()} className="btn-primary px-5 py-3 h-14 leading-none disabled:opacity-50">Post Reply</button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
