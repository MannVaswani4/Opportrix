'use client'
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { User, Link as LinkIcon, FileText, Github, Linkedin, Briefcase, Camera, Save, ArrowDownToLine } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    headline: '',
    bio: '',
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    resumeUrl: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        portfolioUrl: profile.portfolioUrl || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        resumeUrl: profile.resumeUrl || ''
      })
    }
  }, [profile])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), formData)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile.')
    }
    setLoading(false)
  }

  async function simulateFetchLinkedIn() {
    if (!formData.linkedinUrl) {
      toast.error('Please enter a LinkedIn URL first.')
      return
    }
    const toastId = toast.loading('Extracting data from LinkedIn...')
    // Simulate delay
    await new Promise(r => setTimeout(r, 2000))
    setFormData(prev => ({
      ...prev,
      headline: 'Senior Developer extracted from LinkedIn',
      bio: 'Enthusiastic software engineer with 5 years of experience building scalable web applications. (Mock fetched data)',
    }))
    toast.success('LinkedIn data mapped successfully!', { id: toastId })
  }

  if (!profile) return null

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your identity deeply integrated across Opportrix.</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/20">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Core Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="relative mb-4 group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-3xl shadow-inner border-4 border-white">
                 {profile?.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" /> : getInitials(formData.fullName)}
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="font-bold text-xl text-slate-900">{formData.fullName || 'Your Name'}</h2>
            <p className="text-sm font-semibold text-brand-600 tracking-wider uppercase mt-1">{profile.role}</p>
          </div>

          <div className="card p-6">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 mb-4 uppercase">Profile Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-medium"><span className="text-slate-600">Profile Completion</span><span className="text-brand-600">85%</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500" style={{width: '85%'}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-medium"><span className="text-slate-600">ATS Match Score</span><span className="text-emerald-600">Strong</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: '92%'}}></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="md:col-span-2 space-y-6">
          <form className="card p-8 space-y-6" onSubmit={handleSave}>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-slate-400"/> Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold tracking-widest text-slate-500 mb-2">FULL NAME</label>
                  <input className="input w-full bg-slate-50" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold tracking-widest text-slate-500 mb-2">PROFESSIONAL HEADLINE</label>
                  <input className="input w-full bg-slate-50" placeholder="e.g. Senior Fullstack Engineer | React & Node" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold tracking-widest text-slate-500 mb-2">BIO / SUMMARY</label>
                  <textarea rows={4} className="input w-full bg-slate-50 resize-none py-3" placeholder="Tell recruiters what makes you stand out..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-slate-400"/> External Links</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold tracking-widest text-slate-500 mb-2">PORTFOLIO URL</label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input w-full bg-slate-50 pl-10" placeholder="https://yourwebsite.com" value={formData.portfolioUrl} onChange={e => setFormData({...formData, portfolioUrl: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest text-slate-500 mb-2">GITHUB URL</label>
                  <div className="relative">
                    <Github className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input w-full bg-slate-50 pl-10" placeholder="https://github.com/username" value={formData.githubUrl} onChange={e => setFormData({...formData, githubUrl: e.target.value})} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold tracking-widest text-slate-500 mb-2">LINKEDIN URL</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input w-full bg-slate-50 pl-10" placeholder="https://linkedin.com/in/username" value={formData.linkedinUrl} onChange={e => setFormData({...formData, linkedinUrl: e.target.value})} />
                    </div>
                    <button type="button" onClick={simulateFetchLinkedIn} className="btn-secondary px-4 whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                       <ArrowDownToLine className="w-4 h-4 mr-2" /> Sync Data
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400"/> Resume</h3>
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center hover:border-brand-300 hover:bg-brand-50/50 transition-colors cursor-pointer group">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <FileText className="w-6 h-6 text-brand-500" />
                 </div>
                 <p className="font-bold text-slate-700 text-sm mb-1">Upload Resume (PDF)</p>
                 <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">Recruiters prioritize candidates with uploaded resumes. Max size 5MB.</p>
                 
                 {/* For this phase, we use a URL input to simulate successful storage linking */}
                 <div className="w-full relative max-w-md">
                    <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input w-full bg-white pl-10 text-xs" placeholder="Paste Google Drive or PDF link here..." value={formData.resumeUrl} onChange={e => setFormData({...formData, resumeUrl: e.target.value})} />
                 </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
