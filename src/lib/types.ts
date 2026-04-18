export interface UserProfile {
  uid: string
  role: 'freelancer' | 'recruiter'
  fullName: string
  email: string
  photoURL?: string
  headline?: string
  bio?: string
  skills: string[]
  portfolioLinks: string[]
  atsScore: number
  credibilityScore: number
  availability: boolean
  hourlyRate: number
  commentTemplate?: string
  createdAt: number
}

export interface AggregatedPost {
  id: string
  platform: 'linkedin' | 'twitter' | 'reddit'
  postUrl: string
  title: string
  author: string
  authorHandle?: string
  snippet?: string
  postedAt: number
  fetchedAt?: number
  skillTags?: string[]
  budgetMin?: number
  budgetMax?: number
  externalId?: string
}

export interface NativePost {
  id: string
  userId: string
  userDisplayName: string
  userRole: 'freelancer' | 'recruiter'
  userPhotoURL?: string
  content: string
  postType: 'job' | 'portfolio' | 'tips'
  likes: string[]
  commentCount: number
  createdAt: number
}

export interface NativePostComment {
  id: string
  postId: string
  userId: string
  userDisplayName: string
  content: string
  createdAt: number
}

export interface Job {
  id: string
  recruiterId: string
  recruiterName: string
  title: string
  description: string
  skillsRequired: string[]
  budgetMin: number
  budgetMax: number
  status: 'open' | 'closed'
  createdAt: number
}

export interface CommentHistory {
  id: string
  userId: string
  postUrl: string
  platform: string
  message: string
  status: 'sent' | 'failed' | 'pending' | 'pending_manual'
  createdAt: number
}

export interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  revieweeId: string
  stars: number
  reviewText: string
  createdAt: number
}

// Chat message - stored in Firebase Realtime Database
export interface ChatMessage {
  id: string
  senderId: string
  text: string        // field is 'text' in RTDB
  timestamp: number
}

export interface ChatMetadata {
  participants: string[]
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
}
