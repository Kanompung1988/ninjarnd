import { NextRequest, NextResponse } from 'next/server'
import { proxyAdminRequest } from '../../utils'

export async function POST(req: NextRequest) {
  return proxyAdminRequest(req, '/api/admin/subscriptions/assign', 'POST')
}
