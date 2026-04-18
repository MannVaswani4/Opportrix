'use client'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, LogOut, ArrowLeft, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Note: For a real app, you'd listen to a "chats" collection in Firestore or Realtime DB
  // where the user is a participant. Here we simulate the list by fetching other users 
  // they might talk to or who are in their shortlists.
  const [contacts, setContacts] = useState<any[]>([])

  useEffect(() => {
    async function fetchContacts() {
       if (!user) return
       // Fetch a few potential contacts just to show the UI
       const q = query(collection(db, 'users'), where('role', '!=', profile?.role || ''))
       const snap = await getDocs(q)
       const others = snap.docs.map(d => ({uid: d.id, ...d.data()})).filter(u => u.uid !== user.uid)
       
       const chatContacts = others.map(o => {
         const chatId = [user.uid, o.uid].sort().join('_')
         return {
           chatId,
           contactId: o.uid,
           contactName: o.fullName,
           contactRole: o.role,
           photoURL: o.photoURL,
           lastMessage: "Click to view messages",
           time: "Just now"
         }
       })
       setContacts(chatContacts)
    }
    fetchContacts()
  }, [user, profile])

  if (!user) return null

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-6 shrink-0 relative z-20">
        <Link href={profile?.role === 'recruiter' ? '/recruiter' : '/dashboard'} className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold mb-10 transition-transform hover:scale-105 shadow-lg shadow-brand-500/20">
          O
        </Link>
        <Link href={profile?.role === 'recruiter' ? '/recruiter' : '/dashboard'} className="w-10 h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors mb-4">
          <LayoutDashboard className="w-5 h-5" />
        </Link>
        <div className="mt-auto flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-800">
            {getInitials(profile?.fullName || 'U')}
          </div>
          <button className="w-10 h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Contacts List */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 relative z-10 shadow-xl shadow-slate-200/50">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 text-sm bg-slate-50 border-none" placeholder="Search conversations..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contacts.map(c => {
             const active = pathname.includes(c.chatId)
             return (
              <Link key={c.chatId} href={`/chat/${c.chatId}?with=${c.contactId}`} className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-l-4 ${active ? 'bg-brand-50 border-brand-600' : 'border-transparent hover:bg-slate-50'}`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold">
                    {getInitials(c.contactName)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-slate-900 truncate pr-2">{c.contactName}</p>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{c.time}</span>
                  </div>
                  <p className={`text-sm truncate ${active ? 'text-brand-700 font-medium' : 'text-slate-500'}`}>
                    {c.lastMessage}
                  </p>
                </div>
              </Link>
             )
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 bg-white flex flex-col relative z-0">
        {children}
      </main>
    </div>
  )
}
