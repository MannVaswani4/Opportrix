'use client'
import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Users, Briefcase, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<'freelancer' | 'recruiter' | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleContinue() {
    if (!selected || !user) return
    setLoading(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        role: selected,
        fullName: user.displayName || '',
        email: user.email || '',
        skills: [],
        portfolioLinks: [],
        atsScore: 0,
        credibilityScore: 0,
        availability: true,
        hourlyRate: 0,
        createdAt: Date.now(),
      })
      await refreshProfile()
      router.push(selected === 'recruiter' ? '/recruiter' : '/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between px-4 py-10">
      <Link href="/" className="text-brand-600 font-bold text-xl self-start ml-4">Opportrix</Link>

      <div className="w-full max-w-3xl animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">How will you use Opportrix?</h1>
          <p className="text-slate-500">Choose your perspective to tailor your experience. You can switch roles within your dashboard later.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Freelancer card */}
          <button
            onClick={() => setSelected('freelancer')}
            className={`card p-8 text-left transition-all duration-200 hover:shadow-md hover:border-brand-200 ${
              selected === 'freelancer' ? 'border-2 border-brand-500 shadow-md bg-brand-50/30' : ''
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">I am a Freelancer / Student</h2>
            <p className="text-slate-500 text-sm mb-6">Find gigs, build your profile, and automate your outreach.</p>
            <span className="text-brand-600 text-sm font-semibold flex items-center gap-1">
              GET STARTED <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          {/* Recruiter card */}
          <button
            onClick={() => setSelected('recruiter')}
            className={`card p-8 text-left transition-all duration-200 hover:shadow-md hover:border-brand-200 ${
              selected === 'recruiter' ? 'border-2 border-brand-500 shadow-md bg-brand-50/30' : ''
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-6">
              <Briefcase className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">I am a Recruiter / Hiring Manager</h2>
            <p className="text-slate-500 text-sm mb-6">Post jobs, search for top talent, and manage candidates.</p>
            <span className="text-brand-600 text-sm font-semibold flex items-center gap-1">
              HIRE TALENT <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {selected && (
          <div className="text-center mt-8 animate-fade-in">
            <button onClick={handleContinue} disabled={loading} className="btn-primary px-10 py-3 text-base">
              {loading ? 'Setting up your account…' : `Continue as ${selected === 'freelancer' ? 'Freelancer' : 'Recruiter'}`}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-400">You can change this later in settings.</p>
        <p className="text-xs text-slate-300 mt-2 tracking-widest border border-slate-200 px-4 py-1 rounded-full inline-block">TRUSTED BY 500+ COMPANIES</p>
      </div>
    </div>
  )
}
