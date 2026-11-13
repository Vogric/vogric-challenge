/**
 * Cache tag names, in one place so a typo cannot silently break invalidation.
 *
 * Why a single coarse tag instead of `org-${organizationId}`:
 *
 * `use cache` + `cacheTag()` would allow per-organization tags, but that API
 * requires `experimental.cacheComponents`, and Next 15.5.29 refuses to build
 * with it ("can only be enabled when using the latest canary version").
 * `unstable_cache`, the stable option on this version, only accepts a static tag
 * list, so the tag cannot contain the organization id.
 *
 * The trade-off is deliberate: mutating one organization drops the cached KPI
 * counts for every organization. Recomputing three counts is far cheaper than
 * serving a stale number, and the blast radius is bounded by the TTL anyway.
 * When the project moves to a canary with `cacheComponents`, this constant
 * becomes a function and the tag gets the organization id.
 */
export const ORG_STATS_TAG = 'org-stats'

/** TTL for KPI counts. Short enough to self-heal, long enough to matter. */
export const ORG_STATS_TTL_SECONDS = 300
