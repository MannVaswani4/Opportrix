'use client'
import Link from 'next/link'
import { ArrowRight, Zap, BarChart2, MessageSquare, CheckCircle2, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-brand-600 font-bold text-xl tracking-tight">
            Opportrix
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary text-sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 grid md:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-brand-100">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            NEW VERSION 2.0 LIVE
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            The Unified Feed for Your{' '}
            <span className="text-brand-600 italic">Freelance</span> Career.
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed">
            Stop tab-switching. Aggregating the best opportunities from{' '}
            <strong className="text-slate-800">LinkedIn</strong>,{' '}
            <strong className="text-slate-800">Twitter</strong>, and{' '}
            <strong className="text-slate-800">Reddit</strong> into one architectural hub.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth/signup" className="btn-primary px-6 py-3 text-base">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/feed" className="btn-secondary px-6 py-3 text-base">
              Explore Feed
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative flex flex-col gap-4 animate-fade-in">
          {/* Post preview card */}
          <div className="card p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge platform-linkedin text-xs px-2 py-1">
                <Zap className="w-3 h-3" /> Priority Lead
              </span>
              <span className="text-xs text-slate-400">3 minutes ago via Twitter</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 rounded-full w-full" />
              <div className="h-3 bg-slate-100 rounded-full w-2/3" />
            </div>
            <div className="flex gap-2 mt-4">
              <span className="badge bg-slate-100 text-slate-600">React</span>
              <span className="badge bg-slate-100 text-slate-600">TypeScript</span>
            </div>
          </div>

          {/* ATS Match badge */}
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 card p-4 shadow-xl w-36 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mx-auto mb-2">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-slate-500">ATS Match</p>
            <p className="text-2xl font-bold text-brand-600">98%</p>
          </div>

          {/* Conversion stat */}
          <div className="absolute -right-4 -top-6 card p-3 shadow w-28 text-center">
            <p className="text-lg font-bold text-emerald-600">+12%</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Conversion</p>
          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────── */}
      <div className="border-y border-slate-100 bg-white py-5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['AM','ZK','RD'].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">{i[0]}</div>
              ))}
            </div>
            <span className="text-sm text-slate-500">Trusted by <strong className="text-slate-800">10,000+</strong> top-tier freelancers</span>
          </div>
          <div className="flex items-center gap-8 text-slate-300 font-semibold text-sm tracking-widest">
            {['STRIPE','VERCEL','FIGMA','LINEAR'].map(c => <span key={c}>{c}</span>)}
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Precision tools for the modern solo-operator.</h2>
          <p className="text-slate-500">Built by freelancers, for freelancers who value time over noise.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <MessageSquare className="w-6 h-6 text-brand-600" />,
              title: 'Aggregated Feed',
              desc: 'Real-time synchronization with LinkedIn job boards, Twitter search queries, and specific Reddit subreddits. Filter by intent, rate, and tech stack.',
              tags: ['TWITTER API V2','REDDIT (JSON)'],
            },
            {
              icon: <Zap className="w-6 h-6 text-brand-600" />,
              title: 'Auto-Comment Engine',
              desc: 'Draft intelligent, context-aware responses using AI that mirrors your unique professional voice. Be the first to comment on every high-value thread.',
              link: 'Learn about Voice Cloning →',
            },
            {
              icon: <BarChart2 className="w-6 h-6 text-brand-600" />,
              title: 'ATS Profile Score',
              desc: 'Audit your public profiles across the web. Our ATS engine scores your visibility and suggests keyword optimizations to land more inbound requests.',
              link: 'OPTIMIZED FOR "SENIOR FRONTEND"',
            },
          ].map((f) => (
            <div key={f.title} className="card p-7 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">{f.desc}</p>
              {f.tags && (
                <div className="flex gap-2 flex-wrap">
                  {f.tags.map((t) => <span key={t} className="badge bg-slate-100 text-slate-500 text-[10px] font-semibold tracking-wide">{t}</span>)}
                </div>
              )}
              {f.link && <p className="text-brand-600 text-xs font-semibold mt-2">{f.link}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="how" className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How Opportrix works</h2>
            <p className="text-slate-500">Three steps to automate your lead generation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-slate-200" />
            {[
              { n: '01', title: 'Connect your profiles', desc: 'Link your Reddit account and set your skills & target job types. Takes under 2 minutes.' },
              { n: '02', title: 'Browse the feed', desc: 'See all posts from LinkedIn, Twitter and Reddit in one place. Apply filters and select the ones you want.' },
              { n: '03', title: 'Auto-comment & win', desc: 'Set your template once. Opportrix comments on every selected post automatically — you get the gig.' },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white font-bold text-lg flex items-center justify-center mb-5 shadow-lg shadow-brand-200">
                  {s.n}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-slate-900 rounded-3xl p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/50 via-slate-900 to-slate-900" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to reclaim your professional edge?</h2>
            <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">
              Join 10,000+ freelancers who have automated their lead generation process. Start for free today.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/auth/signup" className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-brand-600/30">
                Start Free →
              </Link>
              <a href="#how" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20">
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
          <div>
            <p className="text-brand-600 font-bold text-lg mb-3">Opportrix</p>
            <p className="text-slate-400 text-sm">The operating system for the individual contributor. Aggregating the world's work.</p>
          </div>
          {[
            { title: 'PLATFORM', links: ['The Feed','Integrations','Pricing'] },
            { title: 'COMPANY',  links: ['About Us','Careers','Privacy Policy'] },
            { title: 'NEWSLETTER', links: [] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">{col.title}</p>
              {col.title === 'NEWSLETTER' ? (
                <div>
                  <p className="text-sm text-slate-500 mb-3">Lead generation tips every Tuesday.</p>
                  <div className="flex gap-2">
                    <input className="input flex-1 text-sm py-2" placeholder="Email" />
                    <button className="btn-primary px-3 py-2"><ArrowRight className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">{l}</a></li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-50 px-6 py-4 max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs text-slate-300">© 2024 OPPORTRIX TECHNOLOGIES INC.</p>
          <div className="flex gap-6 text-xs text-slate-400">
            {['TWITTER','LINKEDIN','RSS FEED'].map(l => <a key={l} href="#" className="hover:text-slate-600 transition-colors">{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  )
}
