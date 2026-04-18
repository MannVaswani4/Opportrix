'use client'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { UserProfile } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import { Search, Bell, Star, Eye, MessageSquare, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RecruiterPage() {
  const { user } = useAuth()
  const [freelancers, setFreelancers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm]   = useState('')
  const [minScore, setMinScore]       = useState(0)
  const [loading, setLoading]         = useState(true)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchTalent() {
      setLoading(true)
      const q = query(collection(db, 'users'), where('role', '==', 'freelancer'))
      const snap = await getDocs(q)
      setFreelancers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)))
      setLoading(false)
    }
    fetchTalent()
  }, [])

  const filtered = freelancers.filter(f => {
    if (f.atsScore < minScore) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      const inSkills = f.skills?.some(s => s.toLowerCase().includes(q))
      const inName = f.fullName.toLowerCase().includes(q)
      const inHeadline = f.headline?.toLowerCase().includes(q)
      if (!inSkills && !inName && !inHeadline) return false
    }
    return true
  })

  async function handleShortlist(freelancerId: string) {
    if (!user) return
    const shortlistRef = doc(db, 'shortlists', user.uid, 'candidates', freelancerId)
    await setDoc(shortlistRef, {
      freelancerId,
      addedAt: Date.now(),
      status: 'shortlisted'
    })
    setShortlisted(new Set(shortlisted).add(freelancerId))
    toast.success('Added to shortlist')
  }

  async function startChat(freelancerId: string) {
      if(!user) return
      // Create chat id by sorting UIDs to ensure uniqueness
      const participants = [user.uid, freelancerId].sort()
      const chatId = participants.join('_')
      
      // Update metadata in realtime DB happens via Cloud Functions or client 
      // but for V1 we just route to it
      window.location.href = `/chat/${chatId}?with=${freelancerId}`
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 flex items-center px-6 h-16 shrink-0">
        <h1 className="text-xl font-bold text-slate-900 mr-6">Talent Search</h1>
        <div className="flex items-center gap-3 hidden md:flex">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
            ACTIVE JOBS <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">4</span>
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
            UNREAD MESSAGES <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">12</span>
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
            SHORTLISTED <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">45</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative relative">
             <Bell className="w-5 h-5 text-slate-400" />
             <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
            {getInitials(user?.displayName || 'R')}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
           <div className="relative mb-6">
             <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
                placeholder="Search by name, role, or specific skills..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           {loading ? (
             <div className="grid md:grid-cols-2 gap-4">
               {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 card" />)}
             </div>
           ) : filtered.length === 0 ? (
             <div className="text-center py-20 text-slate-400">No freelancers found matching criteria.</div>
           ) : (
             <div className="grid lg:grid-cols-2 gap-6">
               {filtered.map(f => (
                 <div key={f.uid} className="card p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xl">
                            {f.photoURL ? <img src={f.photoURL} alt={f.fullName} className="w-full h-full object-cover"/> : getInitials(f.fullName)}
                          </div>
                          {f.availability && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white stroke-[3]"/></div>}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 border-b border-transparent">{f.fullName}</h3>
                          <p className="text-sm text-slate-600 mb-1">{f.headline || 'Freelancer'}</p>
                          <div className="flex items-center gap-1 text-amber-400">
                             <Star className="w-4 h-4 fill-amber-400" />
                             <span className="text-sm font-bold text-slate-900">{f.credibilityScore || 0}</span>
                             <span className="text-xs text-slate-400 font-medium ml-1">(0 reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 mb-2">
                           ATS SCORE: {f.atsScore || 0}
                         </div>
                         <div className="text-2xl font-bold text-brand-700">${f.hourlyRate || 0}<span className="text-sm text-slate-500 font-medium">/hr</span></div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {f.skills?.slice(0,3).map(s => <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>)}
                      {f.skills?.length > 3 && <span className="text-xs text-brand-600 font-medium self-center ml-1">+{f.skills.length - 3} more</span>}
                    </div>

                    <div className="flex items-center gap-3 mt-auto">
                      <button 
                         onClick={() => handleShortlist(f.uid)}
                         disabled={shortlisted.has(f.uid)}
                         className={`btn-primary flex-1 justify-center py-2 text-sm ${shortlisted.has(f.uid) ? 'bg-brand-900' : ''}`}
                      >
                         {shortlisted.has(f.uid) ? 'Shortlisted' : 'Shortlist'}
                      </button>
                      <button onClick={() => startChat(f.uid)} className="btn-secondary flex-1 justify-center py-2 text-sm">Message</button>
                      <Link href={`/profile/${f.uid}`} className="btn-secondary px-3 py-2 shrink-0">
                         <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Right filters */}
        <aside className="w-64 bg-white border-l border-slate-100 p-6 hidden xl:block">
           <h3 className="font-bold text-slate-900 text-xs tracking-widest uppercase mb-6">Talent Filters</h3>
           
           <div className="mb-8">
             <label className="text-[10px] font-bold tracking-widest text-slate-400 mb-3 block">ATS SCORE RANGE</label>
             <input type="range" min={0} max={100} value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-brand-600 mb-1" />
             <div className="text-xs text-slate-500 flex justify-between">
               <span>Min. {minScore}</span><span>100</span>
             </div>
           </div>

           <div className="mb-8">
             <label className="text-[10px] font-bold tracking-widest text-slate-400 mb-3 block">MIN. STAR RATING</label>
             <div className="flex gap-1">
               {[1,2,3,4,5].map(s => (
                 <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
               ))}
             </div>
           </div>

           <div className="mb-8">
             <label className="text-[10px] font-bold tracking-widest text-slate-400 mb-3 block">SKILLS</label>
             <div className="flex flex-wrap gap-2">
               {['React','Python','Node.js'].map(s => (
                 <span key={s} className={`badge text-xs ${s==='Node.js' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</span>
               ))}
             </div>
           </div>
        </aside>
      </div>
    </div>
  )
}
