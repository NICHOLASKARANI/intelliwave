import { NextResponse } from 'next/server'
export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('executive_session')
  return res
}