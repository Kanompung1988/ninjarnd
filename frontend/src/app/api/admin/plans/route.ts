import { NextRequest, NextResponse } from 'next/server'
import { proxyAdminRequest } from '../utils'

export async function GET(req: NextRequest) {
  return proxyAdminRequest(req, '/api/admin/plans', 'GET')
}
