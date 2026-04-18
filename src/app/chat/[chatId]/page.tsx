'use client'
import { useState, useEffect, useRef } from 'react'
import { ref, push, set, onChildAdded, serverTimestamp } from 'firebase/database'
import { doc, getDoc } from 'firebase/firestore'
import { rtdb, db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ChatMessage, UserProfile } from '@/lib/types'
import { getInitials, cn } from '@/lib/utils'
import { Send, Image, Paperclip, MoreVertical, Phone, Video } from 'lucide-react'

export default function ChatRoomPage({ params, searchParams }: { params: { chatId: string }, searchParams: { with: string } }) {
  const { user } = useAuth()
  const { chatId } = params
  const withId = searchParams.with

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [contact, setContact] = useState<UserProfile | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadContact() {
       if (!withId) return
       const snap = await getDoc(doc(db, 'users', withId))
       if (snap.exists()) setContact(snap.data() as UserProfile)
    }
    loadContact()
  }, [withId])

  useEffect(() => {
    if (!chatId) return
    const msgsRef = ref(rtdb, `chats/${chatId}/messages`)
    const unsub = onChildAdded(msgsRef, (data) => {
       const msg = { id: data.key, ...data.val() } as ChatMessage
       setMessages(prev => [...prev, msg])
       setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
    // Note: in a full implementation we'd also handle initial load, but onChildAdded handles existing and new in simpler setups.
    return () => {} // unsubscribe if needed
  }, [chatId])

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!text.trim() || !user || !chatId) return
    
    const msgRef = push(ref(rtdb, `chats/${chatId}/messages`))
    await set(msgRef, {
      senderId: user.uid,
      text,
      timestamp: Date.now() // serverTimestamp() does not work offline nicely, using Date.now() for simplicity
    })
    setText('')
  }

  if (!user) return null

  return (
    <>
      {/* Header */}
      <header className="h-20 px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
               {contact?.photoURL ? <img src={contact.photoURL} className="w-full h-full rounded-full object-cover"/> : getInitials(contact?.fullName || 'U')}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
             <h2 className="font-bold text-slate-900 text-lg leading-tight">{contact?.fullName || 'Loading...'}</h2>
             <p className="text-sm text-slate-500">{contact?.headline || 'Active now'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
           <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors"><Phone className="w-5 h-5"/></button>
           <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors"><Video className="w-5 h-5"/></button>
           <div className="w-px h-6 bg-slate-200 mx-1" />
           <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors"><MoreVertical className="w-5 h-5"/></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50">
        <div className="text-center pb-4">
           <span className="text-[10px] font-bold tracking-widest text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">TODAY</span>
        </div>
        
        {messages.map(msg => {
           const isMe = msg.senderId === user.uid
           return (
             <div key={msg.id} className={cn("flex gap-3 max-w-2xl", isMe ? "ml-auto flex-row-reverse" : "")}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex shrink-0 items-center justify-center text-xs font-bold mt-auto">
                    {getInitials(contact?.fullName || 'U')}
                  </div>
                )}
                <div className={cn("px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm", 
                   isMe ? "bg-brand-600 text-white rounded-br-sm" : "bg-white text-slate-700 rounded-bl-sm border border-slate-100")}>
                   {msg.text}
                </div>
                <div className="self-end text-xs text-slate-400 mb-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
             </div>
           )
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-100 shrink-0">
         <form onSubmit={handleSend} className="flex items-end gap-3 max-w-5xl mx-auto">
            <button type="button" className="p-3 text-slate-400 hover:text-brand-600 transition-colors bg-slate-50 hover:bg-brand-50 rounded-xl">
               <Paperclip className="w-5 h-5" />
            </button>
            <button type="button" className="p-3 text-slate-400 hover:text-brand-600 transition-colors bg-slate-50 hover:bg-brand-50 rounded-xl">
               <Image className="w-5 h-5" />
            </button>
            <textarea 
               value={text}
               onChange={e => setText(e.target.value)}
               onKeyDown={e => {if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend()}}}
               placeholder="Write a message..."
               className="flex-1 max-h-32 min-h-[52px] bg-slate-50 border-none resize-none px-5 py-4 text-[15px] focus:ring-0 rounded-2xl"
            />
            <button disabled={!text.trim()} type="submit" className="p-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all disabled:opacity-50 disabled:hover:bg-brand-600 shadow-md shadow-brand-500/20">
               <Send className="w-5 h-5" />
            </button>
         </form>
      </div>
    </>
  )
}
