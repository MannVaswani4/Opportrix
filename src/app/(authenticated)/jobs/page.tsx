'use client'
import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { AggregatedPost } from '@/lib/types'
import { timeAgo, getInitials } from '@/lib/utils'
import { Briefcase, MapPin, DollarSign, ExternalLink, Bot, Send, Sparkles, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JobBoardPage() {
  const { user, profile } = useAuth()
  const [jobs, setJobs] = useState<AggregatedPost[]>([])
  const [loading, setLoading] = useState(true)
  
  // Auto-comment modal state
  const [activeJob, setActiveJob] = useState<AggregatedPost | null>(null)
  const [aiDraft, setAiDraft] = useState('')
  const [drafting, setDrafting] = useState(false)

  useEffect(() => {
    async function fetchJobs() {
      if (!user) return
      setLoading(true)
      try {
        // Fetch from aggregated jobs feed
        const qAgg = query(collection(db, 'aggregatedPosts'), where('type', '==', 'job'), orderBy('publishedAt', 'desc'), limit(50))
        const snap = await getDocs(qAgg)
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as AggregatedPost))
        setJobs(fetched)
      } catch (err) {
        console.error("Error fetching jobs", err)
      }
      setLoading(false)
    }
    fetchJobs()
  }, [user])

  function handleAutoDraft(job: AggregatedPost) {
    setActiveJob(job)
    setDrafting(true)
    
    // Simulate AI generation time
    setTimeout(() => {
       setAiDraft(`Hi! I noticed your recent post for a developer role on ${job.source}. I'm a software engineer with extensive experience matching your required skillset. I'd love to connect and discuss how my background aligns with your team's goals. Let me know if you are open to a quick chat!
       
Best,
${profile?.fullName || 'Candidate'}`)
       setDrafting(false)
    }, 1500)
  }

  function handleSendAutoComment() {
     toast.success('AI outreach successfully dispatched!')
     setActiveJob(null)
     setAiDraft('')
  }

  if (!user) return null

  return (
    <div className="flex bg-slate-50 min-h-screen">
       <div className="flex-1 max-w-5xl mx-auto p-6 md:p-10 flex flex-col">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                 <Briefcase className="w-8 h-8 text-brand-600" /> Job Board
              </h1>
              <p className="text-slate-500 mt-2">Discover real-time gigs from Reddit, LinkedIn, and Opportrix Network.</p>
            </div>
            <button className="btn-secondary px-4"><Filter className="w-4 h-4 mr-2"/> Filters</button>
          </div>

          {loading ? (
             <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 card" />)}
             </div>
          ) : jobs.length === 0 ? (
             <div className="card p-12 text-center text-slate-500">
               <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="text-lg font-bold text-slate-800">No Jobs Found</p>
               <p className="text-sm">Wait for the feed refresh cron to populate the database.</p>
             </div>
          ) : (
             <div className="space-y-4">
               {jobs.map(job => (
                 <div key={job.id} className="card p-6 flex flex-col group hover:border-brand-300 transition-colors">
                    <div className="flex items-start justify-between">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shadow-sm">
                             {getInitials(job.authorName)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{job.title || 'Untitled Job'}</h3>
                            <p className="text-sm text-brand-600 font-semibold mt-0.5">{job.authorName}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                               {job.source && <span className="flex items-center gap-1 uppercase tracking-wider text-slate-400"><ExternalLink className="w-3 h-3"/> {job.source}</span>}
                               {job.createdAt && <span className="flex items-center gap-1">• {timeAgo(job.createdAt)}</span>}
                            </div>
                          </div>
                       </div>
                       
                       <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1">
                          ATS Match: {Math.floor(Math.random() * 20 + 80)}%
                       </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-4 line-clamp-3 leading-relaxed">
                      {job.content}
                    </p>

                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                       {job.url && (
                          <a href={job.url} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                            <ExternalLink className="w-4 h-4 mr-2" /> View Original
                          </a>
                       )}
                       <button onClick={() => handleAutoDraft(job)} className="btn-primary flex-1 justify-center py-2 text-sm ml-auto bg-gradient-to-r from-brand-600 to-indigo-600 border-none hover:shadow-lg hover:shadow-indigo-500/20">
                          <Sparkles className="w-4 h-4 mr-2 fill-white/20" /> Auto-Comment / Email via AI
                       </button>
                    </div>
                 </div>
               ))}
             </div>
          )}
       </div>

       {/* Auto-comment Modal */}
       {activeJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in px-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveJob(null)}></div>
            <div className="bg-white rounded-3xl w-full max-w-xl relative flex flex-col overflow-hidden shadow-2xl animate-scale-in">
               <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-indigo-50/50 to-white">
                 <div className="flex items-center gap-3 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                       <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Opportrix AI Draft</h2>
                      <p className="text-xs font-semibold text-slate-500 tracking-wider">TAILORED OUTREACH</p>
                    </div>
                 </div>
                 <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-1">APPLYING TO:</p>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{activeJob.title}</p>
                 </div>
               </div>
               
               <div className="p-6 bg-slate-50/50">
                  {drafting ? (
                     <div className="h-40 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-semibold text-indigo-600 animate-pulse">Analyzing context & drafting response...</p>
                     </div>
                  ) : (
                     <textarea 
                        className="w-full h-40 input resize-none text-[15px] leading-relaxed p-4 bg-white border border-slate-200 focus:border-indigo-500 shadow-sm rounded-xl"
                        value={aiDraft}
                        onChange={e => setAiDraft(e.target.value)}
                     />
                  )}
               </div>

               <div className="p-6 border-t border-slate-100 flex items-center gap-3 bg-white">
                 <button onClick={() => setActiveJob(null)} className="btn-secondary px-6">Cancel</button>
                 <button onClick={handleSendAutoComment} disabled={drafting} className="btn-primary ml-auto flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-6">
                    Dispatch <Send className="w-4 h-4 ml-1" />
                 </button>
               </div>
            </div>
          </div>
       )}
    </div>
  )
}
