'use client'
import { useState, useEffect } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Users, Briefcase, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OnboardingPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<'freelancer' | 'recruiter' | null>(null)
  const [saving, setSaving] = useState(false)

  // If user already has a profile, redirect them
  useEffect(() => {
    if (!authLoading && profile?.role) {
      router.replace(profile.role === 'recruiter' ? '/recruiter' : '/dashboard')
    }
  }, [authLoading, profile, router])

  // If not logged in, redirect to signup
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signup')
    }
  }, [authLoading, user, router])

  async function handleContinue() {
    if (!selected || !user) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        role: selected,
        fullName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        headline: '',
        bio: '',
        skills: [],
        portfolioLinks: [],
        atsScore: 0,
        credibilityScore: 0,
        availability: true,
        hourlyRate: 0,
        commentTemplate: "Hey {poster_name}! Just saw your post about the {job_title} role. I've worked on similar projects and would love to connect. Sending a DM now!",
        createdAt: Date.now(),
      }, { merge: true })
      
      await refreshProfile()
      toast.success('Profile created! Welcome to Opportrix 🎉')
      router.push(selected === 'recruiter' ? '/recruiter' : '/dashboard')
    } catch (err: any) {
      console.error('Onboarding error:', err)
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between px-4 py-10">
      <Link href="/" className="text-brand-600 font-bold text-xl self-start ml-4">Opportrix</Link>

      <div className="w-full max-w-3xl animate-fade-in">
        <div className="text-center mb-12">
          <p className="text-brand-600 font-semibold text-sm tracking-widest uppercase mb-3">STEP 1 OF 1</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">How will you use Opportrix?</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Choose your perspective to tailor your experience. You can switch roles within your dashboard later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Freelancer card */}
          <button
            onClick={() => setSelected('freelancer')}
            className={cn(
              'card p-8 text-left transition-all duration-200 hover:shadow-md hover:border-brand-200',
              selected === 'freelancer' && 'border-2 border-brand-500 shadow-md bg-brand-50/30'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">I am a Freelancer / Student</h2>
            <p className="text-slate-500 text-sm mb-6">Find gigs, build your profile, and automate your outreach across LinkedIn, Twitter, and Reddit.</p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {['Job Feed', 'Auto-Comment', 'ATS Score', 'Community'].map(f => (
                <span key={f} className="badge bg-brand-50 text-brand-700 text-xs">{f}</span>
              ))}
            </div>
            <span className="text-brand-600 text-sm font-semibold flex items-center gap-1">
              GET STARTED <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          {/* Recruiter card */}
          <button
            onClick={() => setSelected('recruiter')}
            className={cn(
              'card p-8 text-left transition-all duration-200 hover:shadow-md hover:border-brand-200',
              selected === 'recruiter' && 'border-2 border-brand-500 shadow-md bg-brand-50/30'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-6">
              <Briefcase className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">I am a Recruiter / Hiring Manager</h2>
            <p className="text-slate-500 text-sm mb-6">Post jobs, search top talent by ATS score, shortlist candidates, and manage your pipeline.</p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {['Talent Search', 'Post Jobs', 'Shortlist', 'Chat'].map(f => (
                <span key={f} className="badge bg-purple-50 text-purple-700 text-xs">{f}</span>
              ))}
            </div>
            <span className="text-brand-600 text-sm font-semibold flex items-center gap-1">
              HIRE TALENT <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {selected && (
          <div className="text-center mt-10 animate-fade-in">
            <button
              onClick={handleContinue}
              disabled={saving}
              className="btn-primary px-10 py-3.5 text-base shadow-lg shadow-brand-500/20"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Setting up your account…</>
                : <><span>Continue as {selected === 'freelancer' ? 'Freelancer' : 'Recruiter'}</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-400">You can change this later in settings.</p>
      </div>
    </div>
  )
}
