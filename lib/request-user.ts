import { cache } from 'react'
import { getCurrentUserFromServer } from '@/lib/auth'

/**
 * Request-scoped user resolution. React `cache()` is scoped to one server
 * request, so the dashboard layout and page share one JWT/session/user lookup.
 */
export const getRequestUser = cache(getCurrentUserFromServer)
