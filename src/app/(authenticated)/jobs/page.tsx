'use client'
import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { AggregatedPost } from '@/lib/types'
import { timeAgo, getInitials } from '@/lib/utils'
import { Briefcase, ExternalLink, Bot, Send, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JobBoardPage() {
  const { user, profile } = useAuth()
  const [jobs, setJobs] = useState<AggregatedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<AggregatedPost | null>(null)
  const [aiDraft, setAiDraft] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const platforms = ['all', 'linkedin', 'twitter', 'reddit', 'remoteok', 'remotive']

  useEffect(() => {
    async function fetchJobs() {
      if (!user) return
      setLoading(true)
      try {
        // Freelancers see freelance gigs; recruiters see hiring posts
        const tabFilter = profile?.role === 'recruiter' ? 'hiring' : 'freelance'
        const q = query(
          collection(db, 'aggregatedPosts'),
          where('tab', '==', tabFilter),
          orderBy('postedAt', 'desc'),
          limit(50)
        )
        const snap = await getDocs(q)
        setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AggregatedPost)))
      } catch (err) {
        console.error('Error fetching jobs:', err)
      }
      setLoading(false)
    }
    fetchJobs()
  }, [user, profile?.role])

  function handleAutoDraft(job: AggregatedPost) {
    setActiveJob(job)
    setDrafting(true)
    setTimeout(() => {
      setAiDraft(
        `Hi! I saw your ${job.platform} post for "${job.title}". I'm a ${profile?.headline || 'developer'} with skills in ${profile?.skills?.slice(0, 3).join(', ') || 'relevant technologies'} that align well with what you're looking for.\n\nI'd love to connect and learn more about this opportunity — let me know if you have a few minutes!\n\nBest,\n${profile?.fullName || 'Candidate'}`
      )
      setDrafting(false)
    }, 1500)
  }

  function handleSendAutoComment() {
    if (activeJob) {
      // Copy draft to clipboard and open post
      navigator.clipboard.writeText(aiDraft).catch(() => {})
      window.open(activeJob.postUrl, '_blank')
      toast.success('Draft copied! Post opened — paste your message there.')
    }
    setActiveJob(null)
    setAiDraft('')
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-brand-600" />
            {profile?.role === 'recruiter' ? 'Active Hiring Posts' : 'Freelance Job Board'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {profile?.role === 'recruiter'
              ? 'Live hiring posts pulled from LinkedIn and Twitter.'
              : 'Live gig postings from Reddit communities and LinkedIn.'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {platforms.map(p => (
          <button
            key={p}
            onClick={() => setActiveFilter(p)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeFilter === p ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-48 card" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-800 mb-2">No Jobs in Feed Yet</p>
          <p className="text-sm mb-6">The cron job auto-refreshes this feed regularly.</p>
          <button
            onClick={() => {
              // Inject fake data for demo purposes
              setJobs([
                { id: 'demo1', platform: 'linkedin', tab: profile?.role === 'recruiter' ? 'hiring' : 'freelance', title: 'Senior Frontend Engineer (React/Next.js)', author: 'Acme Corp', snippet: 'We are looking for an experienced frontend engineer. You will work on our core product dashboard using Next.js and Tailwind.', postUrl: 'https://linkedin.com', skillTags: ['React', 'Next.js', 'TypeScript'], postedAt: Date.now() - 3600000 },
                { id: 'demo2', platform: 'remoteok', tab: profile?.role === 'recruiter' ? 'hiring' : 'freelance', title: 'Contract Product Designer', author: 'DesignersInc', snippet: 'Fast-paced agency looking for a contract UI/UX designer. Must have strong portfolio.', postUrl: 'https://remoteok.com', skillTags: ['UI/UX', 'Figma'], postedAt: Date.now() - 7200000 },
                { id: 'demo3', platform: 'reddit', tab: profile?.role === 'recruiter' ? 'hiring' : 'freelance', title: '[HIRING] Node.js Backend Dev - Remote', author: 'u/startup_founder', snippet: 'Building a fintech app, need a solid Node.js dev for architecture and deployment.', postUrl: 'https://reddit.com', skillTags: ['Node.js', 'PostgreSQL', 'AWS'], postedAt: Date.now() - 86400000 },
              ])
            }}
            className="btn-primary px-6 py-2.5 shadow-md"
          >
            <Sparkles className="w-4 h-4 inline-block mr-2" /> Load Demo Data
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.filter(j => activeFilter === 'all' || j.platform === activeFilter).map(job => (
            <div key={job.id} className="card p-7 flex flex-col group hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 border border-slate-200/60 bg-white/60 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-brand-500 transition-colors" />
              <div className="flex items-start justify-between gap-5">
                <div className="flex gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-700 font-bold text-lg shrink-0">
                    {getInitials((job.author || 'Anonymous').replace(/^u\//i, ''))}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-snug tracking-tight group-hover:text-brand-700 transition-colors">{job.title || 'Untitled Posting'}</h3>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
                      <p className="text-sm text-slate-700 font-bold">{(job.author || 'Anonymous').replace(/^u\//i, '')}</p>
                      {job.authorHandle && (
                        <p className="text-xs text-slate-400 font-medium">({job.authorHandle})</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-bold">
                      <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-black text-white">{job.platform}</span>
                      <span>·</span>
                      <span>{timeAgo(job.postedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Snippet */}
              <p className="text-sm text-slate-600 mt-5 line-clamp-3 leading-relaxed font-medium">
                {job.snippet || 'No description available.'}
              </p>

              {/* Skill tags */}
              {job.skillTags && job.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {job.skillTags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200/60 shadow-sm">{tag}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100/80">
                {job.postUrl && (
                  <a
                    href={job.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> View Post
                  </a>
                )}
                <button
                  onClick={() => handleAutoDraft(job)}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all ml-auto"
                >
                  <Sparkles className="w-4 h-4" /> Auto-Comment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Draft Modal */}
      {activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in px-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setActiveJob(null)} />
          <div className="bg-white rounded-3xl w-full max-w-xl relative shadow-2xl flex flex-col overflow-hidden z-10">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-indigo-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Opportrix AI Draft</h2>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tailored Outreach</p>
                </div>
                <button onClick={() => setActiveJob(null)} className="ml-auto text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-0.5">RESPONDING TO:</p>
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">{activeJob.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">by {activeJob.author} · {activeJob.platform}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50">
              {drafting ? (
                <div className="h-44 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-indigo-600 animate-pulse">Drafting personalised message…</p>
                </div>
              ) : (
                <textarea
                  className="w-full h-44 input resize-none text-sm leading-relaxed p-4 bg-white border border-slate-200 focus:border-indigo-400 rounded-xl shadow-sm"
                  value={aiDraft}
                  onChange={e => setAiDraft(e.target.value)}
                />
              )}
              <p className="text-xs text-slate-400 mt-2">
                The post will open in a new tab and this message will be copied to your clipboard.
              </p>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center gap-3 bg-white">
              <button onClick={() => setActiveJob(null)} className="btn-secondary px-5 py-2.5">Cancel</button>
              <button
                onClick={handleSendAutoComment}
                disabled={drafting || !aiDraft.trim()}
                className="ml-auto flex items-center gap-2 px-6 py-2.5 font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Open & Copy <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
