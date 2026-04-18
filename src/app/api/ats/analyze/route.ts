import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Polyfill DOMMatrix for pdf-parse compatibility in Next.js Server environment
if (typeof globalThis !== 'undefined' && !(globalThis as any).DOMMatrix) {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a=1; b=0; c=0; d=1; e=0; f=0;
    constructor() {}
  }
}
if (typeof global !== 'undefined' && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {
    a=1; b=0; c=0; d=1; e=0; f=0;
    constructor() {}
  }
}
// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('resume') as File | null
    const jobTitle = formData.get('jobTitle') as string | null

    if (!file || !jobTitle) {
      return NextResponse.json({ error: 'Missing resume file or job title' }, { status: 400 })
    }

    // Read the file into a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamically require pdf-parse so Webpack hoisting doesn't break the global polyfill
    let pdfParse = require('pdf-parse');
    if (pdfParse && typeof pdfParse !== 'function' && typeof pdfParse.default === 'function') {
      pdfParse = pdfParse.default;
    }

    // Parse the PDF
    const pdfData = await pdfParse(buffer)
    const resumeText = pdfData.text

    if (!resumeText || resumeText.trim().length === 0) {
      console.error("PDF Parsing returned empty text.");
      return NextResponse.json({ error: 'Could not extract text from the PDF.' }, { status: 400 })
    }

    // Prepare prompt
    const prompt = `
You are an expert ATS (Applicant Tracking System) software and technical recruiter.
I will give you a resume text and a target Job Title.
Evaluate the resume for the target job role. Be extremely strict and realistic like a true ATS.

Calculate a score from 0 to 100 on how well the resume matches the job title's typical requirements.
Return your response ONLY AS VALID JSON matching this exact structure, with no markdown formatting or extra text:
{
  "score": number,
  "matchedKeywords": ["Keyword1", "Keyword2"],
  "missingKeywords": ["Missing1", "Missing2"],
  "tips": ["One line tip 1", "One line tip 2"],
  "verdict": "A brief 2-3 sentence verdict on the candidate's fit."
}

Job Title: ${jobTitle}
Resume:
${resumeText}
    `

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()
    
    // Clean up potential markdown blocks if Gemini included them
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('ATS Analyze Error:', error)
    return NextResponse.json({ error: error.message || 'Error parsing resume' }, { status: 500 })
  }
}
