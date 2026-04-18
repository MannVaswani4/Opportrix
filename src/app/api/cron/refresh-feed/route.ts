import { NextResponse } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Classify a post as 'freelance' or 'hiring' based on its title/content.
 *
 * Freelance = individual offering services, or someone looking for a contractor
 *             Keywords: freelance, for hire, contract, gig, part-time, side project
 * Hiring    = company/employer posting a full-time or direct-hire role
 *             Keywords: hiring, full-time, we are looking for, join our team, salary
 */
function classifyTab(title: string, snippet?: string): 'freelance' | 'hiring' {
  const text = `${title} ${snippet || ''}`.toLowerCase()

  // Strong hiring signals
  const hiringSignals = [
    '[hiring]', 'we are hiring', 'join our team', 'full-time', 'full time',
    'permanent role', 'salary', 'at our company', 'we\'re looking for',
    'we are looking for', 'apply now', 'job opening', 'job opportunity',
    'opening at', 'position at', 'employee', 'staff', 'onsite', 'hybrid',
  ]

  // Strong freelance signals
  const freelanceSignals = [
    '[for hire]', 'for hire', 'freelance', 'contract', 'contractor',
    'gig', 'part-time', 'part time', 'hourly', '/hr', 'per hour',
    'side project', 'short-term', 'short term', 'remote contract',
    'available for', 'open to work', 'seeking clients', 'looking for clients',
    'taking on', 'project basis', 'fiverr', 'upwork', 'toptal',
  ]

  let hiringScore = 0
  let freelanceScore = 0

  for (const s of hiringSignals) { if (text.includes(s)) hiringScore++ }
  for (const s of freelanceSignals) { if (text.includes(s)) freelanceScore++ }

  return freelanceScore >= hiringScore ? 'freelance' : 'hiring'
}

// ─── JSearch (via RapidAPI) ──────────────────────────────────────────────────
async function fetchJSearchJobs(): Promise<any[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  // Run separate queries for both freelance and hiring tabs
  const queryGroups = [
    // Hiring queries
    { q: 'software engineer remote full-time', defaultTab: 'hiring' as const },
    { q: 'product designer remote hiring', defaultTab: 'hiring' as const },
    { q: 'backend developer remote job', defaultTab: 'hiring' as const },
    // Freelance queries
    { q: 'freelance developer contract remote', defaultTab: 'freelance' as const },
    { q: 'freelance react developer remote', defaultTab: 'freelance' as const },
    { q: 'freelance designer contract', defaultTab: 'freelance' as const },
  ]

  const results: any[] = []

  for (const { q, defaultTab } of queryGroups) {
    try {
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q)}&page=1&num_pages=1&date_posted=week`,
        {
          headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': 'jsearch.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
          next: { revalidate: 0 },
        }
      )

      if (!res.ok) {
        console.warn(`JSearch fetch failed for query "${q}":`, res.status)
        continue
      }

      const data = await res.json()
      const jobs = (data.data || []).slice(0, 3).map((job: any) => {
        const title = job.job_title || 'Untitled Role'
        const snippet = job.job_description?.slice(0, 250) || ''
        // Let content classification override the default tab for accuracy
        const tab = classifyTab(title, snippet) || defaultTab

        return {
          platform: 'linkedin' as const,
          tab,
          title,
          author: job.employer_name || 'Unknown Company',
          snippet,
          postUrl: job.job_apply_link || job.job_google_link || '#',
          skillTags: (job.job_required_skills || []).slice(0, 5),
          postedAt: job.job_posted_at_timestamp
            ? job.job_posted_at_timestamp * 1000
            : Date.now(),
          externalId: job.job_id,
        }
      })
      results.push(...jobs)
    } catch (err) {
      console.error(`JSearch error for "${q}":`, err)
    }
  }
  return results
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────
async function fetchTwitterPosts(): Promise<any[]> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) return []

  try {
    const decoded = decodeURIComponent(token)

    // Run two separate queries: one for freelancers, one for hiring
    const twitterQueries = [
      { query: '("for hire" OR "available for work" OR "freelance" remote developer) -is:retweet lang:en', defaultTab: 'freelance' as const },
      { query: '(hiring developer OR "we are hiring" OR "join our team" remote) -is:retweet lang:en', defaultTab: 'hiring' as const },
    ]

    const results: any[] = []

    for (const { query, defaultTab } of twitterQueries) {
      const res = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=8&tweet.fields=author_id,created_at,text&expansions=author_id&user.fields=name,username`,
        {
          headers: { Authorization: `Bearer ${decoded}` },
          next: { revalidate: 0 },
        }
      )

      if (!res.ok) {
        console.warn('Twitter API error:', res.status, await res.text())
        continue
      }

      const data = await res.json()
      const tweets = data.data || []
      const users: Record<string, any> = {}
      for (const u of data.includes?.users || []) {
        users[u.id] = u
      }

      const mapped = tweets.map((t: any) => {
        const title = t.text.slice(0, 100) + (t.text.length > 100 ? '…' : '')
        const tab = classifyTab(t.text) || defaultTab
        return {
          platform: 'twitter' as const,
          tab,
          title,
          author: users[t.author_id]?.name || 'Twitter User',
          authorHandle: `@${users[t.author_id]?.username || 'user'}`,
          snippet: t.text,
          postUrl: `https://twitter.com/i/web/status/${t.id}`,
          skillTags: [],
          postedAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
          externalId: t.id,
        }
      })
      results.push(...mapped)
    }
    return results
  } catch (err) {
    console.error('Twitter error:', err)
    return []
  }
}

// ─── Reddit ───────────────────────────────────────────────────────────────────
async function fetchRedditPosts(): Promise<any[]> {
  const results: any[] = []

  // r/forhire has both [FOR HIRE] and [HIRING] posts — we classify each one
  // r/freelance and r/freelancers are freelance-oriented
  // r/remotework and r/jobsearchhacks are hiring-oriented
  const subreddits = [
    { name: 'forhire',         defaultTab: null },          // mixed — classify per post
    { name: 'freelance',       defaultTab: 'freelance' as const },
    { name: 'freelancers',     defaultTab: 'freelance' as const },
    { name: 'remotework',      defaultTab: 'hiring' as const },
    { name: 'jobsearchhacks',  defaultTab: 'hiring' as const },
  ]

  for (const { name, defaultTab } of subreddits) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${name}/new.json?limit=10`,
        {
          headers: { 'User-Agent': 'Opportrix/1.0' },
          next: { revalidate: 0 },
        }
      )
      if (!res.ok) continue

      const data = await res.json()
      const posts = (data.data?.children || [])
        .filter((c: any) => !c.data.stickied)
        .slice(0, 5)
        .map((c: any) => {
          const title: string = c.data.title || 'Untitled Post'
          const snippet: string = c.data.selftext?.slice(0, 250) || title

          // For mixed subs, classify from content. For opinionated subs, use default.
          const tab = defaultTab || classifyTab(title, snippet)

          return {
            platform: 'reddit' as const,
            tab,
            title,
            author: `u/${c.data.author}`,
            snippet,
            postUrl: `https://reddit.com${c.data.permalink}`,
            skillTags: [],
            postedAt: (c.data.created_utc || Date.now() / 1000) * 1000,
            externalId: c.data.id,
          }
        })
      results.push(...posts)
    } catch (err) {
      console.error(`Reddit error for r/${name}:`, err)
    }
  }
  return results
}

// ─── RemoteOK ─────────────────────────────────────────────────────────────────
async function fetchRemoteOK(): Promise<any[]> {
  try {
    const res = await fetch('https://remoteok.com/api', { next: { revalidate: 0 } })
    if (!res.ok) return []
    const data = await res.json()
    // First element is legal text, skip it
    return (data || []).slice(1, 4).map((job: any) => {
      const title = job.position || 'Untitled Role'
      const snippet = (job.description || '').replace(/(<([^>]+)>)/gi, '').slice(0, 250)
      const tab = classifyTab(title, snippet) || 'hiring' // default to hiring for RemoteOK

      return {
        platform: 'remoteok' as const,
        tab,
        title,
        author: job.company || 'RemoteOK Company',
        snippet,
        postUrl: job.url || '#',
        skillTags: job.tags || [],
        postedAt: job.date ? new Date(job.date).getTime() : Date.now(),
        externalId: job.id,
      }
    })
  } catch (err) {
    console.error('RemoteOK error:', err)
    return []
  }
}

// ─── Remotive ─────────────────────────────────────────────────────────────────
async function fetchRemotive(): Promise<any[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=5', { next: { revalidate: 0 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || []).slice(0, 3).map((job: any) => {
      const title = job.title || 'Untitled Role'
      const snippet = (job.description || '').replace(/(<([^>]+)>)/gi, '').slice(0, 250)
      const tab = classifyTab(title, snippet) || 'hiring'

      return {
        platform: 'remotive' as const,
        tab,
        title,
        author: job.company_name || 'Remotive Company',
        snippet,
        postUrl: job.url || '#',
        skillTags: job.tags || [],
        postedAt: job.publication_date ? new Date(job.publication_date).getTime() : Date.now(),
        externalId: job.id?.toString(),
      }
    })
  } catch (err) {
    console.error('Remotive error:', err)
    return []
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { adminDb } = await import('@/lib/firebase-admin')

    const [jsearchJobs, twitterPosts, redditPosts, remoteOK, remotive] = await Promise.all([
      fetchJSearchJobs(),
      fetchTwitterPosts(),
      fetchRedditPosts(),
      fetchRemoteOK(),
      fetchRemotive(),
    ])

    const allPosts = [...jsearchJobs, ...twitterPosts, ...redditPosts, ...remoteOK, ...remotive]

    if (allPosts.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, message: 'No posts fetched from APIs' })
    }

    // Tally per tab for visibility
    const freelanceCount = allPosts.filter(p => p.tab === 'freelance').length
    const hiringCount    = allPosts.filter(p => p.tab === 'hiring').length

    const batch = adminDb.batch()
    const postsRef = adminDb.collection('aggregatedPosts')
    for (const post of allPosts) {
      batch.set(postsRef.doc(), { ...post, createdAt: Date.now() })
    }
    await batch.commit()

    return NextResponse.json({
      success: true,
      inserted: allPosts.length,
      breakdown: {
        jsearch: jsearchJobs.length,
        twitter: twitterPosts.length,
        reddit: redditPosts.length,
        remoteOK: remoteOK.length,
        remotive: remotive.length,
        freelance: freelanceCount,
        hiring: hiringCount,
      },
    })
  } catch (error: any) {
    console.error('Feed Refresh Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
