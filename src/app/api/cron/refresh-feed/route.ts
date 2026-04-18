import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic' // Ensure this doesn't get statically cached

// Example mock data to populate feed if external APIs are not set
const MOCK_JOBS = [
  { platform: 'linkedin', title: 'Senior React Engineer', author: 'Netflix', snippet: 'Looking for a senior engineer to join our performance team.', postUrl: 'https://linkedin.com', budgetMin: 120000, skillTags: ['react', 'performance'] },
  { platform: 'twitter', title: 'Freelance UI Designer Needed', author: '@startup_founder', snippet: 'Need an amazing UI designer for our new fintech app. DM me!', postUrl: 'https://twitter.com', budgetMin: 5000, skillTags: ['ui', 'fintech', 'figma'] },
  { platform: 'reddit', title: '[HIRING] Node.js Developer (Remote)', author: 'u/tech_recruiter_99', snippet: 'Our startup is hiring a backend dev with 3+ years experience in Express and PostgreSQL.', postUrl: 'https://reddit.com', budgetMin: 80000, skillTags: ['node.js', 'postgres'] },
  { platform: 'linkedin', title: 'Marketing Consultant', author: 'Stripe', snippet: 'Looking for a freelance marketing consultant for a 3-month project.', postUrl: 'https://linkedin.com', budgetMin: 10000, budgetMax: 15000, skillTags: ['marketing', 'strategy'] }
]

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const batch = adminDb.batch()
    const postsRef = adminDb.collection('aggregatedPosts')

    // Add exactly MOCK_JOBS items
    // In a real app, you would fetch from Twitter API, Adzuna API, Reddit API here.
    for (const job of MOCK_JOBS) {
      const docRef = postsRef.doc() // Generate new ID
      batch.set(docRef, {
        ...job,
        postedAt: Date.now() - Math.floor(Math.random() * 86400000), // Sometime in the last 24h
        createdAt: Date.now()
      })
    }

    await batch.commit()

    return NextResponse.json({ success: true, inserted: MOCK_JOBS.length })
  } catch (error: any) {
    console.error('Feed Refresh Error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
