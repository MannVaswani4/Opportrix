import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let adminApp: App

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  )

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  })

  return adminApp
}

export const adminAuth = getAuth(getAdminApp())
export const adminDb   = getFirestore(getAdminApp())
