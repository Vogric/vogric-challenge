import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const ORG_ID = __ENV.ORG_ID || 'cmw3d2pdu0002hm3qhyinu26i'
const EMAIL = __ENV.DEMO_EMAIL || 'demo@example.com'
const PASSWORD = __ENV.DEMO_PASSWORD || 'password123'

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '60s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:tasks}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
}

export function setup() {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  const setCookie = response.headers['Set-Cookie'] || ''
  const match = setCookie.match(/session=[^;]+/)
  if (!match) throw new Error('Login failed: no session cookie')

  return { cookie: match[0] }
}

export default function (data) {
  const response = http.get(
    `${BASE_URL}/api/dashboard/tasks?orgId=${ORG_ID}&page=1&pageSize=50`,
    {
      headers: { Cookie: data.cookie },
      tags: { endpoint: 'tasks' },
    }
  )

  check(response, {
    'tasks status is 200': (res) => res.status === 200,
    'tasks payload is paginated': (res) => Boolean(res.json('pagination.totalCount')),
  })

  sleep(0.5)
}
