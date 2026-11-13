import { cache } from 'react'
import { getCurrentUserFromServer } from '@/lib/auth'

/**
 * Request-scoped memoization of the current user.
 *
 * The dashboard layout and the page inside it both need the user, and both used
 * to walk the full chain (verify JWT -> session row -> user row) independently,
 * so every dashboard render paid for it twice.
 *
 * React's `cache()` is scoped to a single server request, so this is safe to use
 * from any Server Component and cannot leak a user across requests.
 */
export const getRequestUser = cache(getCurrentUserFromServer)
