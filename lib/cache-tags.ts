/**
 * Cache tag names. The stable `unstable_cache` API only accepts static tags on
 * Next 15.5.29, so the tag is coarse: mutating one organization invalidates KPI
 * counts for all organizations. Recomputing three counts is cheaper than
 * serving stale data; the TTL bounds the blast radius.
 */
export const ORG_STATS_TAG = 'org-stats'

/** TTL for KPI counts. Short enough to self-heal, long enough to matter. */
export const ORG_STATS_TTL_SECONDS = 300
