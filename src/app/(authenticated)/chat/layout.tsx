'use client'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { getInitials, cn } from '@/lib/utils'

export default function ChatContactsLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const pathname = usePathname()
  
  const [contacts, setContacts] = useState<any[]>([])

  useEffect(() => {
    async function fetchContacts() {
       if (!user || !profile) return
       // Fetch potential contacts (e.g., opposite role)
       const q = query(collection(db, 'users'), where('role', '!=', profile.role))
       const snap = await getDocs(q)
       const others = snap.docs.map(d => ({uid: d.id, ...d.data()})).filter(u => u.uid !== user.uid)
       
       const chatContacts = others.map(o => {
         const chatId = [user.uid, o.uid].sort().join('_')
         return {
           chatId,
           contactId: o.uid,
           contactName: o.fullName || 'User',
           contactRole: o.role,
           photoURL: o.photoURL,
           lastMessage: "Click to start chatting",
           time: "New"
         }
       })
       setContacts(chatContacts)
    }
    fetchContacts()
  }, [user, profile])

  if (!user) return null

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      {/* Contacts List */}
      <aside className="w-80 border-r border-slate-100 flex flex-col shrink-0 relative z-10">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full bg-slate-50 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Search conversations..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contacts.map(c => {
             const active = pathname.includes(c.chatId)
             return (
              <Link key={c.chatId} href={`/chat/${c.chatId}?with=${c.contactId}`} className={cn("flex items-start gap-3 p-4 cursor-pointer transition-colors border-l-4", active ? "bg-brand-50 border-brand-600" : "border-transparent hover:bg-slate-50")}>
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold">
                    {c.photoURL ? <img src={c.photoURL} alt={c.contactName} className="w-full h-full rounded-full object-cover" /> : getInitials(c.contactName)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-slate-900 truncate pr-2">{c.contactName}</p>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{c.time}</span>
                  </div>
                  <p className={cn("text-sm truncate", active ? "text-brand-700 font-medium" : "text-slate-500")}>
                    {c.lastMessage}
                  </p>
                </div>
              </Link>
             )
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 bg-white flex flex-col relative z-0 relative">
        {children}
      </main>
    </div>
  )
}
