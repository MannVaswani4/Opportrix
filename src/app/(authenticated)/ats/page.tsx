'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { Search, Plus, X } from 'lucide-react'

interface ATSResult {
  score: number
  missingKeywords: string[]
  matchedKeywords: string[]
}

function CircularProgress({ score }: { score: number }) {
  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={180} height={180} className="rotate-[-90deg]">
      <circle cx={90} cy={90} r={r} fill="none" stroke="#e2e8f0" strokeWidth={12} />
      <circle
        cx={90} cy={90} r={r} fill="none"
        stroke={color} strokeWidth={12}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
      />
      <text x={90} y={90} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={28} fontWeight="bold" className="rotate-90"
        style={{ transform: 'rotate(90deg)', transformOrigin: '90px 90px' }}>
        {score}
      </text>
      <text x={90} y={115} textAnchor="middle" dominantBaseline="middle"
        fill="#94a3b8" fontSize={10} fontWeight="600"
        style={{ transform: 'rotate(90deg)', transformOrigin: '90px 90px' }}>
        OUT OF 100
      </text>
    </svg>
  )
}

export default function ATSPage() {
  const { profile, user, refreshProfile } = useAuth()
  const [jobTitle, setJobTitle] = useState('')
  const [result, setResult]     = useState<ATSResult | null>(null)
  const [loading, setLoading]   = useState(false)

  async function fetchATS() {
    if (!jobTitle.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ats?title=${encodeURIComponent(jobTitle)}`)
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error('Failed to fetch ATS data')
    } finally {
      setLoading(false)
    }
  }

  async function addSkill(keyword: string) {
    if (!user || !profile) return
    const newSkills = [...(profile.skills || []), keyword]
    await updateDoc(doc(db, 'users', user.uid), { skills: newSkills })
    await refreshProfile()
    // Recalculate
    if (result) {
      const matched = result.matchedKeywords.concat(keyword)
      const missing = result.missingKeywords.filter(k => k !== keyword)
      const score   = Math.round((matched.length / 30) * 100)
      setResult({ score, matchedKeywords: matched, missingKeywords: missing })
    }
    toast.success(`"${keyword}" added to your skills!`)
  }

  const label = result ? (result.score >= 80 ? 'STRONG MATCH' : result.score >= 60 ? 'GOOD MATCH' : 'NEEDS WORK') : ''
  const labelColor = result ? (result.score >= 80 ? 'text-emerald-600' : result.score >= 60 ? 'text-amber-600' : 'text-red-500') : ''

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">ATS Profile Score</h1>
        <p className="text-slate-500 text-sm">Check how well your profile matches a target job role.</p>
      </div>

      {/* Search */}
      <div className="card p-6 mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-slate-700 block mb-2">Target Job Title</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="e.g. Senior React Developer, UI/UX Designer…"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchATS()}
            />
          </div>
        </div>
        <button onClick={fetchATS} disabled={loading || !jobTitle.trim()} className="btn-primary py-2.5 px-6 text-sm shrink-0">
          {loading ? 'Analysing…' : 'Check Score'}
        </button>
      </div>

      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-8 flex flex-col items-center gap-4">
            <div className="skeleton w-44 h-44 rounded-full" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="card p-8 space-y-3">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-8 rounded-full" />)}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Score ring */}
          <div className="card p-8 flex flex-col items-center">
            <p className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">ATS Optimization Score</p>
            <CircularProgress score={result.score} />
            <p className={`text-lg font-bold mt-4 ${labelColor}`}>{label}</p>
            <p className="text-sm text-slate-400 mt-1">Based on top {result.matchedKeywords.length + result.missingKeywords.length} keywords for "{jobTitle}"</p>

            <div className="mt-6 w-full">
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-3">MATCHED KEYWORDS</p>
              <div className="flex flex-wrap gap-2">
                {result.matchedKeywords.slice(0,10).map(k => (
                  <span key={k} className="badge bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">✓ {k}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Missing keywords */}
          <div className="card p-8">
            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wide">Missing Keywords</p>
            <p className="text-xs text-slate-400 mb-5">Click a keyword to add it to your profile skills instantly.</p>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords.map(k => (
                <button
                  key={k}
                  onClick={() => addSkill(k)}
                  className="badge bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {k}
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 bg-brand-50 rounded-xl border border-brand-100">
              <p className="text-sm font-semibold text-brand-800 mb-2">💡 Optimization Tips</p>
              <ul className="text-xs text-brand-700 space-y-1.5">
                <li>• Add missing keywords to your profile bio</li>
                <li>• Include them in your portfolio project descriptions</li>
                <li>• Score of 80%+ dramatically improves recruiter visibility</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Current skills */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="card p-6 mt-6">
          <p className="text-xs font-bold tracking-widest text-slate-400 mb-3">YOUR CURRENT SKILLS</p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(s => (
              <span key={s} className="badge bg-brand-50 text-brand-700 border border-brand-100">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
