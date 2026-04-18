'use client'
import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { Search, Plus, Upload, FileText, CheckCircle2, ChevronRight, Sparkles, Loader2 } from 'lucide-react'

interface ATSResult {
  score: number
  matchedKeywords: string[]
  missingKeywords: string[]
  tips: string[]
  verdict: string
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
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [result, setResult]     = useState<ATSResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB.')
        return
      }
      setResumeFile(file)
    }
  }

  async function fetchATS() {
    if (!jobTitle.trim()) {
      toast.error('Please enter a target job title.')
      return
    }
    if (!resumeFile) {
      toast.error('Please upload your resume (PDF).')
      return
    }
    setLoading(true)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobTitle', jobTitle)

      const res = await fetch('/api/ats/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze resume')
      }

      setResult(data)
      toast.success('Analysis complete!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch Context-Aware ATS data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function addSkill(keyword: string) {
    if (!user || !profile) return
    const newSkills = [...(profile.skills || []), keyword]
    await updateDoc(doc(db, 'users', user.uid), { skills: newSkills })
    await refreshProfile()
    
    // Simulate Score Increase locally without re-hitting API
    if (result) {
      const matched = [...result.matchedKeywords, keyword]
      const missing = result.missingKeywords.filter(k => k !== keyword)
      // Small bump in score for each keyword added (capped at 100)
      const score = Math.min(100, result.score + 2)
      setResult({ ...result, score, matchedKeywords: matched, missingKeywords: missing })
    }
    toast.success(`"${keyword}" added to your skills!`)
  }

  const label = result ? (result.score >= 80 ? 'STRONG MATCH' : result.score >= 60 ? 'GOOD MATCH' : 'NEEDS WORK') : ''
  const labelColor = result ? (result.score >= 80 ? 'text-emerald-600' : result.score >= 60 ? 'text-amber-600' : 'text-red-500') : ''

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-brand-600" />
          AI Resume ATS Score
        </h1>
        <p className="text-slate-500 text-sm">Powered by Gemini. Upload your resume and receive context-aware optimization feedback.</p>
      </div>

      {/* Inputs Form */}
      <div className="card p-6 mb-8 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <label className="text-sm font-bold tracking-wide text-slate-700 block mb-2">Target Job Title</label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10 h-12 w-full text-sm bg-slate-50"
              placeholder="e.g. Senior Full-Stack Engineer"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchATS()}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold tracking-wide text-slate-700 block mb-2">Upload Resume (PDF)</label>
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50 bg-slate-50 rounded-xl h-12 flex items-center justify-center gap-3 transition-colors text-sm font-semibold text-slate-600 overflow-hidden px-4"
          >
            <Upload className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="truncate">
              {resumeFile ? resumeFile.name : 'Select or drop PDF file...'}
            </span>
            {resumeFile && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-auto" />}
          </button>
        </div>
      </div>
      
      <div className="flex justify-end mb-8">
        <button 
          onClick={fetchATS} 
          disabled={loading || !jobTitle.trim() || !resumeFile} 
          className="btn-primary py-3 px-8 shadow-lg shadow-brand-500/30 flex items-center gap-2 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scanning Resume…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze Match
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="grid md:grid-cols-3 gap-6 animate-pulse">
          <div className="card p-8 flex flex-col items-center gap-4 col-span-1">
            <div className="w-44 h-44 rounded-full bg-slate-200/50" />
            <div className="h-5 w-32 bg-slate-200 rounded" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="card p-6 min-h-[140px] bg-slate-50 border-transparent space-y-3">
              <div className="w-1/3 h-5 bg-slate-200 rounded-md" />
              <div className="w-full h-16 bg-slate-200/50 rounded-xl" />
            </div>
            <div className="card p-6 min-h-[180px] bg-slate-50 border-transparent space-y-3">
               <div className="w-1/4 h-5 bg-slate-200 rounded-md" />
               <div className="flex gap-2">
                 <div className="w-20 h-8 bg-slate-200/50 rounded-full" />
                 <div className="w-24 h-8 bg-slate-200/50 rounded-full" />
                 <div className="w-16 h-8 bg-slate-200/50 rounded-full" />
               </div>
            </div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in items-start">
          {/* Score ring */}
          <div className="card p-8 flex flex-col items-center col-span-1 sticky top-24 shadow-md border-brand-100">
            <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Match Score</p>
            <CircularProgress score={result.score} />
            <p className={`text-xl font-bold mt-6 ${labelColor}`}>{label}</p>
            <p className="text-xs text-center text-slate-500 mt-2 font-medium">AI evaluated your strengths vs requirements for "{jobTitle}"</p>
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Verdict */}
            <div className="card p-7 bg-indigo-50 border-indigo-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
               <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                 <BotIcon className="w-5 h-5 text-indigo-600" /> Executive summary
               </h3>
               <p className="text-sm text-indigo-800/90 leading-relaxed font-medium">
                 {result.verdict}
               </p>
            </div>

            {/* Missing keywords */}
            <div className="card p-7">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" /> Critical Missing Keywords
              </h3>
              <p className="text-xs text-slate-500 mb-5">These keywords are heavily associated with the role. Click one to add it to your profile skills.</p>
              
              {result.missingKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {result.missingKeywords.map(k => (
                    <button
                      key={k}
                      onClick={() => addSkill(k)}
                      className="px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all text-sm font-semibold shadow-sm flex items-center gap-1.5 group"
                    >
                      <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> {k}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-600 font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> You hit all the major keywords!
                </p>
              )}
            </div>
            
            {/* Actionable Tips */}
            {result.tips && result.tips.length > 0 && (
              <div className="card p-7 border-brand-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-500" /> AI Optimization Recommendations
                </h3>
                <ul className="space-y-3">
                  {result.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <ChevronRight className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-snug">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Matched keywords */}
            <div className="card p-7">
              <h3 className="text-sm font-bold text-slate-900 mb-4">You successfully matched</h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedKeywords.map(k => (
                  <span key={k} className="px-3 py-1 bg-slate-100 text-slate-600 font-medium text-xs rounded-lg border border-slate-200">
                    {k}
                  </span>
                ))}
                {result.matchedKeywords.length === 0 && (
                  <span className="text-sm text-slate-500 italic">No strong keyword matches found.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  )
}
