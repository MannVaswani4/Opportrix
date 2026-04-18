import { NextResponse } from 'next/server'

// JSearch API via RapidAPI - fetches remote dev jobs
async function fetchJSearchJobs(): Promise<any[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  try {
    const queries = ['freelance developer remote', 'freelance designer remote', 'freelance react developer']
    const results: any[] = []

    for (const q of queries) {
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
      const jobs = (data.data || []).slice(0, 4).map((job: any) => ({
        platform: 'linkedin' as const,
        title: job.job_title || 'Untitled Role',
        author: job.employer_name || 'Unknown Company',
        snippet: job.job_description?.slice(0, 250) || '',
        postUrl: job.job_apply_link || job.job_google_link || '#',
        budgetMin: job.job_min_salary || null,
        budgetMax: job.job_max_salary || null,
        skillTags: (job.job_required_skills || []).slice(0, 5),
        postedAt: job.job_posted_at_timestamp
          ? job.job_posted_at_timestamp * 1000
          : Date.now(),
        externalId: job.job_id,
      }))
      results.push(...jobs)
    }
    return results
  } catch (err) {
    console.error('JSearch error:', err)
    return []
  }
}

// Twitter API - search for freelance job tweets
async function fetchTwitterPosts(): Promise<any[]> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) return []

  try {
    const decoded = decodeURIComponent(token)
    const query = '(hiring freelance developer OR freelance designer OR looking for freelancer) -is:retweet lang:en'
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=author_id,created_at,text&expansions=author_id&user.fields=name,username`,
      {
        headers: { Authorization: `Bearer ${decoded}` },
        next: { revalidate: 0 },
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.warn('Twitter API error:', res.status, err)
      return []
    }

    const data = await res.json()
    const tweets = data.data || []
    const users: Record<string, any> = {}
    for (const u of data.includes?.users || []) {
      users[u.id] = u
    }

    return tweets.map((t: any) => ({
      platform: 'twitter' as const,
      title: t.text.slice(0, 80) + (t.text.length > 80 ? '…' : ''),
      author: users[t.author_id]?.name || 'Twitter User',
      authorHandle: `@${users[t.author_id]?.username || 'user'}`,
      snippet: t.text,
      postUrl: `https://twitter.com/i/web/status/${t.id}`,
      skillTags: [],
      postedAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
      externalId: t.id,
    }))
  } catch (err) {
    console.error('Twitter error:', err)
    return []
  }
}

// Reddit API (no auth required for read-only)
async function fetchRedditPosts(): Promise<any[]> {
  try {
    const subreddits = ['forhire', 'freelance', 'remotework']
    const results: any[] = []

    for (const sub of subreddits) {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/new.json?limit=8`,
        {
          headers: { 'User-Agent': 'Opportrix/1.0' },
          next: { revalidate: 0 },
        }
      )

      if (!res.ok) continue

      const data = await res.json()
      const posts = (data.data?.children || [])
        .filter((c: any) => !c.data.stickied)
        .slice(0, 4)
        .map((c: any) => ({
          platform: 'reddit' as const,
          title: c.data.title || 'Untitled Post',
          author: `u/${c.data.author}`,
          snippet: c.data.selftext?.slice(0, 250) || c.data.title,
          postUrl: `https://reddit.com${c.data.permalink}`,
          skillTags: [],
          postedAt: (c.data.created_utc || Date.now() / 1000) * 1000,
          externalId: c.data.id,
        }))

      results.push(...posts)
    }
    return results
  } catch (err) {
    console.error('Reddit error:', err)
    return []
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Protect in production
  const authHeader = request.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { adminDb } = await import('@/lib/firebase-admin')

    // Fetch from all sources concurrently
    const [jsearchJobs, twitterPosts, redditPosts] = await Promise.all([
      fetchJSearchJobs(),
      fetchTwitterPosts(),
      fetchRedditPosts(),
    ])

    const allPosts = [...jsearchJobs, ...twitterPosts, ...redditPosts]

    if (allPosts.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, message: 'No posts fetched from APIs' })
    }

    const batch = adminDb.batch()
    const postsRef = adminDb.collection('aggregatedPosts')

    for (const post of allPosts) {
      const docRef = postsRef.doc()
      batch.set(docRef, {
        ...post,
        createdAt: Date.now(),
      })
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      inserted: allPosts.length,
      breakdown: {
        jsearch: jsearchJobs.length,
        twitter: twitterPosts.length,
        reddit: redditPosts.length,
      },
    })
  } catch (error: any) {
    console.error('Feed Refresh Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
