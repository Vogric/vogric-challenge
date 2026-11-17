import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const ORG_ID = __ENV.ORG_ID

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:tasks}': ['p(95)<300'],
  },
}

export function setup() {
  if (!ORG_ID) throw new Error('ORG_ID is required: set -e ORG_ID=<organization-id>')

  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'demo@example.com', password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  )

  if (response.status !== 200) {
    throw new Error(`login failed: HTTP ${response.status}`)
  }

  const session = response.cookies.session?.[0]?.value
  if (!session) throw new Error('login response did not set a session cookie')

  return { session, orgId: ORG_ID }
}

export default function (data) {
  const response = http.get(
    `${BASE_URL}/api/dashboard/tasks?orgId=${encodeURIComponent(data.orgId)}&pageSize=50`,
    {
      headers: { Cookie: `session=${data.session}` },
      tags: { name: 'tasks' },
    }
  )

  check(response, {
    'tasks status is 200': (result) => result.status === 200,
    'tasks payload has rows': (result) => {
      try {
        return Array.isArray(JSON.parse(result.body).tasks)
      } catch {
        return false
      }
    },
  })

  sleep(1)
}
