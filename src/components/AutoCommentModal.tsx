'use client'
import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { AggregatedPost } from '@/lib/types'
import { substituteTemplate, platformLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import { X, Zap, CheckCircle2, Linkedin, Twitter } from 'lucide-react'

interface Props {
  selectedPosts: AggregatedPost[]
  onClose: () => void
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-4 h-4 text-blue-600" />,
  twitter:  <Twitter className="w-4 h-4 text-slate-800" />,
  reddit:   <span className="text-orange-500 font-bold text-xs">r/</span>,
}

export default function AutoCommentModal({ selectedPosts, onClose }: Props) {
  const { profile, user } = useAuth()
  const [template, setTemplate] = useState(profile?.commentTemplate || "Hey {poster_name}! Just saw your post about the {job_title} role. I've worked on similar projects recently and would love to discuss how I can help. Sending a DM now!")
  const [dailyLimit, setDailyLimit] = useState(25)
  const [sending, setSending] = useState(false)

  function insertVar(v: string) {
    setTemplate(t => t + ` {${v}}`)
  }

  function getPreview(post: AggregatedPost) {
    return substituteTemplate(template, {
      poster_name: post.author,
      job_title:  post.title,
      platform:   post.platform,
      my_skill:   profile?.skills?.[0] || 'React',
      company:    post.author,
    })
  }

  async function handleSend() {
    if (!user) return
    setSending(true)
    let sent = 0
    const results: Array<{ post: AggregatedPost; status: string }> = []

    for (const post of selectedPosts.slice(0, dailyLimit)) {
      const message = getPreview(post)
      let status = 'pending_manual'

      if (post.platform === 'reddit') {
        // Reddit real API would fire here if refresh_token exists
        status = 'pending_manual'
      } else if (post.platform === 'twitter') {
        status = 'pending_manual'
        // open in new tab
        window.open(post.postUrl, '_blank')
      } else {
        // LinkedIn
        window.open(post.postUrl, '_blank')
        status = 'pending_manual'
      }

      await addDoc(collection(db, 'commentsHistory'), {
        userId: user.uid,
        postUrl: post.postUrl,
        platform: post.platform,
        message,
        status,
        createdAt: Date.now(),
      })

      results.push({ post, status })
      sent++

      // Copy to clipboard
      await navigator.clipboard.writeText(message).catch(() => {})
    }

    setSending(false)
    toast.success(`Queued ${sent} comments — posts opened in new tabs. Paste & send!`)
    onClose()
  }

  const allValid = !template.includes('{my_skill') || (profile?.skills?.length ?? 0) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Bulk Auto-Comment</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{selectedPosts.length} posts selected</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left – Template */}
          <div className="flex-1 p-7 border-r border-slate-100 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-widest text-slate-400">COMMENT TEMPLATE</p>
              <span className="text-xs text-brand-600 font-medium cursor-pointer">✦ AI Suggestions</span>
            </div>
            <textarea
              className="input resize-none h-40 font-mono text-sm"
              value={template}
              onChange={e => setTemplate(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">VARIABLES:</span>
              {['poster_name','job_title','company','platform','my_skill'].map(v => (
                <button key={v} onClick={() => insertVar(v)}
                  className="badge bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer">
                  {`{${v}}`}
                </button>
              ))}
            </div>

            {/* Automation settings */}
            <div className="mt-7">
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">AUTOMATION SETTINGS</p>
              <div className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-lg">🛡</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Daily Comment Limit</p>
                    <p className="text-xs text-slate-400">Protects your account from spam flags</p>
                  </div>
                </div>
                <input
                  type="number"
                  min={1} max={50}
                  value={dailyLimit}
                  onChange={e => setDailyLimit(Number(e.target.value))}
                  className="w-16 text-center input py-1.5 font-bold text-brand-700 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Right – Live Preview */}
          <div className="flex-1 p-7 overflow-y-auto bg-slate-50">
            <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">LIVE PREVIEW</p>
            <div className="space-y-4">
              {selectedPosts.slice(0, 3).map(post => (
                <div key={post.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {PLATFORM_ICONS[post.platform]}
                    <span className="text-xs font-semibold text-slate-600">{platformLabel(post.platform)}</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      {(profile?.fullName || 'U')[0]}
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 leading-relaxed flex-1">
                      {getPreview(post).split(/(\{[^}]+\})/).map((seg, i) => {
                        if (seg.startsWith('{') && seg.endsWith('}')) {
                          return <span key={i} className="text-brand-600 font-semibold">{post.author}</span>
                        }
                        return <span key={i}>{seg}</span>
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {selectedPosts.length > 3 && (
                <p className="text-xs text-slate-400 text-center">+{selectedPosts.length - 3} more posts</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${allValid ? 'text-emerald-500' : 'text-amber-400'}`} />
            <span className="text-sm text-slate-600">{allValid ? 'All variables correctly mapped' : 'Add skills to your profile'}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary text-sm px-5 py-2">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="btn-primary text-sm px-6 py-2">
              {sending ? 'Processing…' : `Send Comments (${selectedPosts.length}) ▶`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
