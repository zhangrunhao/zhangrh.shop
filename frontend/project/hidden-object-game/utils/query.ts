export const readQuery = () => new URLSearchParams(window.location.search)

export const getQueryValue = (key: string) => readQuery().get(key) ?? ''

export const updateQuery = (params: Record<string, string | number | null>) => {
  const url = new URL(window.location.href)
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key)
    } else {
      url.searchParams.set(key, String(value))
    }
  })
  window.history.pushState(null, '', url)
}
