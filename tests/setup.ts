// Tests do not load .env.local: provide strong test secrets so lib/jwt can
// validate its configuration at import time.
process.env.JWT_SECRET ??= 'test-jwt-secret-0123456789abcdef0123456789'

import '@testing-library/jest-dom'
