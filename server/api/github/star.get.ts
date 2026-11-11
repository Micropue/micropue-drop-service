const OWNER = 'Micropue'
const REPO = 'micropue-drop-service'
const TTL = 60 * 60 * 1000

// 只缓存成功结果：请求失败时下次访问会重试，不会把 null 锁一小时
let cache: { stars: number; at: number } | null = null

// GitHub API 未认证只有 60 次/小时，限流时退回抓仓库页 HTML 里的 stargazerCount
async function fetchStars(): Promise<number> {
    try {
        const repo = await $fetch<{ stargazers_count: number }>(`https://api.github.com/repos/${OWNER}/${REPO}`, {
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': 'micropue-drop'
            }
        })
        return repo.stargazers_count
    } catch (err) {
        console.warn('[github] API 获取失败，改抓仓库页：', err instanceof Error ? err.message : err)
        const html = await $fetch<string>(`https://github.com/${OWNER}/${REPO}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            responseType: 'text'
        })
        const match = html.match(/"stargazerCount":(\d+)/)
        if (!match) throw new Error('stargazerCount not found')
        return Number(match[1])
    }
}

export default defineEventHandler(async () => {
    if (cache && Date.now() - cache.at < TTL) return { stars: cache.stars }

    try {
        const stars = await fetchStars()
        cache = { stars, at: Date.now() }
        return { stars }
    } catch (err) {
        console.warn('[github] star 获取失败：', err instanceof Error ? err.message : err)
        return { stars: null }
    }
})
