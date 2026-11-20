export function useNoIndex() {
  useSeoMeta({
    robots: 'noindex, nofollow'
  })
}
