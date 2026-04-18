'use client'
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserProfile } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import { Star, MapPin, Briefcase, Mail, Link as LinkIcon, CheckCircle2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function PublicProfilePage({ params }: { params: { uid: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const snap = await getDoc(doc(db, 'users', params.uid))
      if (snap.exists()) setProfile({ uid: snap.id, ...snap.data() } as UserProfile)
      setLoading(false)
    }
    loadProfile()
  }, [params.uid])

  if (loading) return <div className="h-screen flex items-center justify-center">Loading profile...</div>
  if (!profile) return <div className="h-screen flex items-center justify-center">Profile not found.</div>

  async function startChat() {
      if(!user) return
      const chatId = [user.uid, profile!.uid].sort().join('_')
      router.push(`/chat/${chatId}?with=${profile!.uid}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Minimal */}
      <nav className="h-16 bg-white border-b border-slate-100 flex items-center px-8">
         <Link href="/" className="text-brand-600 font-bold text-xl">Opportrix</Link>
         <div className="ml-auto flex gap-4">
            {user ? (
               <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-600">Back to Dashboard</Link>
            ) : (
               <Link href="/auth/login" className="btn-primary text-sm px-5 py-2">Sign In</Link>
            )}
         </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto py-12 px-6">
         {/* Profile Header */}
         <div className="card p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-600 to-brand-400" />
            <div className="relative pt-12 flex flex-col sm:flex-row gap-6 mt-4 items-start sm:items-end">
               <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl shrink-0">
                 <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-4xl font-bold overflow-hidden">
                    {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover"/> : getInitials(profile.fullName)}
                 </div>
               </div>
               <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-1.5">
                     <h1 className="text-3xl font-bold text-slate-900">{profile.fullName}</h1>
                     {profile.role === 'freelancer' && profile.atsScore > 80 && (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                     )}
                  </div>
                  <p className="text-lg text-slate-600 mb-4">{profile.headline || 'Member of Opportrix'}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                     <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> Remote</span>
                     <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {profile.availability ? 'Available for work' : 'Not available'}</span>
                     <span className="flex items-center gap-1.5 text-amber-500"><Star className="w-4 h-4 fill-amber-500"/> {profile.credibilityScore || 0} Credibility</span>
                  </div>
               </div>
               {user && user.uid !== profile.uid && (
                  <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                     <button onClick={startChat} className="btn-primary flex-1 sm:flex-none justify-center px-6 py-3 shadow-lg shadow-brand-500/20">
                        <MessageSquare className="w-4 h-4" /> Message
                     </button>
                  </div>
               )}
            </div>
         </div>

         <div className="grid md:grid-cols-3 gap-6">
            {/* Left Col */}
            <div className="md:col-span-2 space-y-6">
               <div className="card p-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">About</h2>
                  <p className="text-slate-600 leading-relaxed">
                     Passionate professional dedicated to delivering high-quality results. 
                     Leveraging extensive experience to help companies build solid foundations and scale operations efficiently.
                  </p>
               </div>

               {profile.role === 'freelancer' && (
                  <div className="card p-8 bg-brand-50/30 border-brand-100">
                     <div className="flex items-center justify-between mb-6">
                        <div>
                           <h2 className="text-lg font-bold text-slate-900 mb-1">ATS Profile Optimization</h2>
                           <p className="text-sm text-slate-500">Based on industry standard keyword analysis</p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-600 font-bold text-xl bg-white shadow-sm">
                           {profile.atsScore}
                        </div>
                     </div>
                  </div>
               )}

               <div className="card p-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Skills & Expertise</h2>
                  <div className="flex flex-wrap gap-2">
                     {profile.skills?.length ? profile.skills.map(s => (
                        <span key={s} className="badge bg-slate-100 text-slate-700 px-3 py-1.5 text-sm font-medium">{s}</span>
                     )) : <p className="text-sm text-slate-400">No skills added yet.</p>}
                  </div>
               </div>
            </div>

            {/* Right Col */}
            <div className="space-y-6">
               <div className="card p-6">
                  <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-4">Rates</h2>
                  <div className="text-3xl font-bold text-slate-900">${profile.hourlyRate || 0} <span className="text-lg text-slate-400 font-medium tracking-normal">/ hr</span></div>
               </div>
               
               <div className="card p-6">
                  <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-4">Links</h2>
                  <div className="space-y-3">
                     {profile.portfolioLinks?.length ? profile.portfolioLinks.map(l => (
                        <a key={l} href={l} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
                           <LinkIcon className="w-4 h-4" /> {new URL(l).hostname}
                        </a>
                     )) : <p className="text-sm text-slate-400">No links provided.</p>}
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  )
}
