// Resolves a real photo for a named football player using Wikipedia's public,
// CORS-enabled API — no API key needed, and Wikipedia's REST API is explicitly
// built for this kind of reuse. Photos come from Wikimedia Commons and are
// typically CC-BY-SA or public domain; that's fine for in-app display like
// this, but keep that in mind if you ever repackage/redistribute the images
// themselves elsewhere.
//
// Flow per player name:
//   1. Search Wikipedia for "<name> footballer" to land on the correct
//      disambiguated page (e.g. "Bono" the goalkeeper vs. Bono of U2).
//   2. Fetch that page's summary, which includes a thumbnail image if one
//      exists on the page.
// Results (including "not found") are cached in memory so each unique name
// only ever triggers one network round trip per session, no matter how many
// components render that player.

const cache = new Map() // name -> Promise<string|null>

async function resolve(name) {
  try {
    const searchUrl =
      `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*` +
      `&srlimit=1&srsearch=${encodeURIComponent(`${name} footballer`)}`
    const searchRes = await fetch(searchUrl)
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const title = searchData?.query?.search?.[0]?.title
    if (!title) return null

    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    )
    if (!summaryRes.ok) return null
    const summary = await summaryRes.json()
    return summary?.thumbnail?.source || summary?.originalimage?.source || null
  } catch {
    return null
  }
}

// Returns a Promise<string|null> — a photo URL, or null if none was found.
// Safe to call repeatedly with the same name; only the first call per name
// hits the network.
export function getPlayerPhoto(name) {
  if (!cache.has(name)) cache.set(name, resolve(name))
  return cache.get(name)
}
