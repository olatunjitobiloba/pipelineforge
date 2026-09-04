import { NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function proxyToBackend(request: Request, campaignId: string) {
  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return NextResponse.json({ detail: 'Missing Authorization header' }, { status: 401 })
  }

  const headers = new Headers({
    Authorization: authorization,
  })

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers.set('Content-Type', contentType)
  }

  const response = await fetch(`${BACKEND_API_URL}/campaigns/${campaignId}`, {
    method: 'PATCH',
    headers,
    body: await request.text(),
  })

  const responseText = await response.text()

  if (!responseText) {
    return new NextResponse(null, { status: response.status })
  }

  try {
    return NextResponse.json(JSON.parse(responseText), { status: response.status })
  } catch {
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain; charset=utf-8',
      },
    })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await context.params
  return proxyToBackend(request, campaignId)
}
