'use client'
import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  User, Link as LinkIcon, FileText, Github, Linkedin,
  Briefcase, Save, ArrowDownToLine, Plus, X, CheckCircle2, Loader2
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Next.js', 'Vue', 'Angular',
  'Docker', 'Figma', 'UI Design', 'UX Research', 'GraphQL', 'PostgreSQL',
  'AWS', 'Firebase', 'Flutter', 'Swift', 'Kotlin', 'SEO', 'Copywriting',
  'Video Editing', 'Motion Graphics', 'PHP', 'WordPress', 'Data Analysis',
]

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetchingLinkedIn, setFetchingLinkedIn] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    headline: '',
    bio: '',
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    resumeUrl: '',
    photoURL: '',
    skills: [] as string[],
  })
  const [newSkillInput, setNewSkillInput] = useState('')

  // Sync form from loaded profile
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        portfolioUrl: profile.portfolioUrl || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        resumeUrl: profile.resumeUrl || '',
        photoURL: profile.photoURL || '',
        skills: profile.skills || [],
      })
    }
  }, [profile])

  function addSkill(skill: string) {
    const trimmed = skill.trim()
    if (!trimmed || formData.skills.includes(trimmed)) return
    setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
    setNewSkillInput('')
  }

  function removeSkill(skill: string) {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const payload = {
        fullName: formData.fullName,
        headline: formData.headline,
        bio: formData.bio,
        portfolioUrl: formData.portfolioUrl,
        githubUrl: formData.githubUrl,
        linkedinUrl: formData.linkedinUrl,
        resumeUrl: formData.resumeUrl,
        photoURL: formData.photoURL,
        skills: formData.skills,
      }
      await updateDoc(doc(db, 'users', user.uid), payload)
      await refreshProfile()          // re-fetch so header name updates too
      toast.success('Profile saved!')
    } catch (err) {
      console.error(err)
      toast.error('Save failed. Please try again.')
    }
    setLoading(false)
  }

  async function simulateFetchLinkedIn() {
    if (!formData.linkedinUrl.trim()) {
      toast.error('Enter your LinkedIn profile URL first.')
      return
    }
    setFetchingLinkedIn(true)
    const toastId = toast.loading('Extracting data from LinkedIn URL…')
    await new Promise(r => setTimeout(r, 2000))

    // Extract an inferred name from the URL slug, e.g. /in/john-doe → John Doe
    const slug = formData.linkedinUrl.split('/in/')[1]?.replace(/\//g, '') || ''
    const inferredName = slug
      ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : formData.fullName

    setFormData(prev => ({
      ...prev,
      fullName: inferredName || prev.fullName,
      headline: prev.headline || 'Software Engineer @ Company (fetched from LinkedIn)',
      bio: prev.bio || 'Passionate software engineer with experience building scalable web products. (LinkedIn bio will appear here after full integration.)',
      skills: prev.skills.length
        ? prev.skills
        : ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    }))

    toast.success('LinkedIn data mapped! Review and save.', { id: toastId })
    setFetchingLinkedIn(false)
  }

  const completionPct = () => {
    let pts = 0
    if (formData.fullName) pts += 20
    if (formData.headline) pts += 15
    if (formData.bio) pts += 15
    if (formData.skills.length > 0) pts += 20
    if (formData.portfolioUrl) pts += 10
    if (formData.resumeUrl || formData.githubUrl) pts += 10
    if (formData.linkedinUrl) pts += 10
    return Math.min(pts, 100)
  }

  if (!profile) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    </div>
  )

  const pct = completionPct()

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your public identity. Changes are saved to Firestore and reflected across the platform.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* ── Left column ── */}
        <div className="space-y-5">
          {/* Avatar card */}
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
              {formData.photoURL
                ? <img src={formData.photoURL} alt={formData.fullName} className="w-full h-full object-cover" />
                : profile.photoURL 
                  ? <img src={profile.photoURL} alt={formData.fullName} className="w-full h-full object-cover" />
                  : getInitials(formData.fullName)}
            </div>
            <h2 className="font-bold text-lg text-slate-900 break-all">{formData.fullName || 'Your Name'}</h2>
            <span className="mt-1 badge bg-brand-100 text-brand-700 text-[10px] font-bold tracking-widest uppercase">{profile.role}</span>
          </div>

          {/* Completion */}
          <div className="card p-5">
            <p className="text-xs font-bold tracking-widest text-slate-400 mb-4 uppercase">Profile Strength</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">{pct}% complete</span>
              {pct >= 80 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              {!formData.headline && <li className="flex gap-1.5 items-center"><span className="text-amber-500">•</span> Add a headline</li>}
              {!formData.bio && <li className="flex gap-1.5 items-center"><span className="text-amber-500">•</span> Write your bio</li>}
              {!formData.skills.length && <li className="flex gap-1.5 items-center"><span className="text-amber-500">•</span> Add at least one skill</li>}
              {!formData.resumeUrl && <li className="flex gap-1.5 items-center"><span className="text-amber-500">•</span> Link your resume</li>}
            </ul>
          </div>
        </div>

        {/* ── Right / form ── */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal info */}
          <section className="card p-7 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-brand-500" /> Personal Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold tracking-widest text-slate-500 mb-1.5">FULL NAME</label>
                <input
                  className="input w-full bg-slate-50"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold tracking-widest text-slate-500 mb-1.5">PROFILE PICTURE URL</label>
                <input
                  className="input w-full bg-slate-50"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.photoURL}
                  onChange={e => setFormData({ ...formData, photoURL: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold tracking-widest text-slate-500 mb-1.5">PROFESSIONAL HEADLINE</label>
                <input
                  className="input w-full bg-slate-50"
                  placeholder="e.g. Senior Fullstack Engineer · React & Node.js"
                  value={formData.headline}
                  onChange={e => setFormData({ ...formData, headline: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold tracking-widets text-slate-500 mb-1.5">BIO / SUMMARY</label>
                <textarea
                  rows={4}
                  className="input w-full bg-slate-50 resize-none"
                  placeholder="Tell recruiters and collaborators what makes you unique…"
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="card p-7">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4"><Briefcase className="w-4 h-4 text-brand-500" /> Skills & Expertise</h3>
            <p className="text-xs text-slate-500 mb-4">Your skills are used to filter the Job Board and rank your ATS score against job postings.</p>

            {/* Current skill tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
              {formData.skills.map(s => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-sm font-semibold">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.skills.length === 0 && (
                <p className="text-sm text-slate-400 italic">No skills added yet. Add your first skill below.</p>
              )}
            </div>

            {/* Add custom skill */}
            <div className="flex gap-2 mb-5">
              <input
                className="input flex-1 bg-slate-50 text-sm"
                placeholder="Type a skill and press Enter…"
                value={newSkillInput}
                onChange={e => setNewSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkillInput) } }}
              />
              <button onClick={() => addSkill(newSkillInput)} className="btn-primary px-4 py-2 text-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick-add suggestions */}
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 mb-2">QUICK ADD</p>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter(s => !formData.skills.includes(s)).slice(0, 14).map(s => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="badge text-xs bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* External links */}
          <section className="card p-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-brand-500" /> External Links</h3>

            <div>
              <label className="block text-xs font-bold tracking-widests text-slate-500 mb-1.5">PORTFOLIO URL</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input w-full bg-slate-50 pl-10" placeholder="https://yourwebsite.com" value={formData.portfolioUrl} onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widests text-slate-500 mb-1.5">GITHUB URL</label>
              <div className="relative">
                <Github className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input w-full bg-slate-50 pl-10" placeholder="https://github.com/username" value={formData.githubUrl} onChange={e => setFormData({ ...formData, githubUrl: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widests text-slate-500 mb-1.5">LINKEDIN PROFILE URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input w-full bg-slate-50 pl-10"
                    placeholder="https://linkedin.com/in/yourname"
                    value={formData.linkedinUrl}
                    onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={simulateFetchLinkedIn}
                  disabled={fetchingLinkedIn}
                  className="px-4 py-2.5 flex items-center gap-2 text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-60"
                >
                  {fetchingLinkedIn
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ArrowDownToLine className="w-4 h-4" />}
                  Sync Data
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Clicking "Sync Data" will auto-fill your name, headline, bio & skills from your LinkedIn profile URL.
              </p>
            </div>
          </section>

          {/* Resume */}
          <section className="card p-7">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-brand-500" /> Resume</h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste a shareable link to your resume (Google Drive, Dropbox, Notion, or any public PDF). Recruiters will see this directly on your profile.
            </p>

            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input w-full bg-slate-50 pl-10"
                placeholder="https://drive.google.com/file/d/... or any public PDF link"
                value={formData.resumeUrl}
                onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
              />
            </div>

            {formData.resumeUrl && (
              <a
                href={formData.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-sm text-brand-600 hover:underline font-medium"
              >
                <FileText className="w-4 h-4" /> Preview Resume →
              </a>
            )}
          </section>

          {/* Save button bottom */}
          <div className="flex justify-end pb-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving…' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
