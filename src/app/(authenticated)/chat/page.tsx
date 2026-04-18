import { MessageSquare } from 'lucide-react'

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
      <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-brand-100">
        <MessageSquare className="w-8 h-8 text-brand-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Messages</h2>
      <p className="text-slate-500 max-w-sm text-sm">Select a conversation from the sidebar to view messages, send proposals, and manage your network.</p>
    </div>
  )
}
