import { NextResponse } from 'next/server'

// Simple mock ATS logic. In a real application, you'd use OpenAI or a dedicated NLP service
// to extract keywords from a job description and compare them against a user's resume.
const ROLE_KEYWORDS: Record<string, string[]> = {
  'frontend': ['react', 'next.js', 'typescript', 'javascript', 'css', 'html', 'tailwind', 'ui/ux', 'responsive design', 'api integration', 'state management', 'redux', 'jest'],
  'backend': ['node.js', 'python', 'java', 'sql', 'postgresql', 'mongodb', 'docker', 'aws', 'rest api', 'graphql', 'microservices', 'redis', 'caching'],
  'designer': ['figma', 'ui design', 'ux design', 'wireframing', 'prototyping', 'user research', 'adobe cc', 'interaction design', 'design systems', 'accessibility'],
  'fullstack': ['react', 'node.js', 'typescript', 'sql', 'api design', 'aws', 'docker', 'system architecture', 'git', 'ci/cd']
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  
  // Find closest role match or default to a generic mix
  const lowerTitle = title.toLowerCase()
  let targetKeywords: string[] = []
  
  if (lowerTitle.includes('front')) targetKeywords = ROLE_KEYWORDS.frontend
  else if (lowerTitle.includes('back')) targetKeywords = ROLE_KEYWORDS.backend
  else if (lowerTitle.includes('design') || lowerTitle.includes('ui')) targetKeywords = ROLE_KEYWORDS.designer
  else if (lowerTitle.includes('full')) targetKeywords = ROLE_KEYWORDS.fullstack
  else targetKeywords = ['communication', 'problem solving', 'project management', 'agile', 'git', 'collaboration']

  // Randomize a bit to simulate processing
  const score = Math.floor(Math.random() * 40) + 40 // 40-80 base score
  
  // Pick some keywords as matched missing
  const shuffled = [...targetKeywords].sort(() => 0.5 - Math.random())
  const splitIdx = Math.floor(shuffled.length * (score / 100))
  
  const matchedKeywords = shuffled.slice(0, splitIdx)
  const missingKeywords = shuffled.slice(splitIdx)

  return NextResponse.json({
    score,
    matchedKeywords,
    missingKeywords
  })
}
