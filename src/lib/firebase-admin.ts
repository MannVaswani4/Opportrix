import { initializeApp, getApps, getApp as _getApp, App } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is not set.')
  }

  let serviceAccount: any
  try {
    serviceAccount = JSON.parse(raw)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.')
  }

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  })
}

export const adminAuth = getAuth(getAdminApp())
export const adminDb   = getFirestore(getAdminApp())
