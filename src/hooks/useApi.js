import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads data from the API and tracks loading/error state.
 * `deps` are compared by value; when they change the request is re-run and any
 * response from an older request is ignored, so fast filter changes can't show
 * stale results.
 *
 *   const { data, meta, loading, error, reload } = useApi(() => workshopsApi.list(params), [params])
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null })
  const [reloadToken, setReloadToken] = useState(0)
  const fetcherRef = useRef(fetcher)
  const key = JSON.stringify(deps)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let stale = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcherRef
      .current()
      .then((res) => {
        if (!stale) setState({ data: res?.data ?? res, meta: res?.meta ?? null, loading: false, error: null })
      })
      .catch((error) => {
        if (!stale) setState((s) => ({ ...s, loading: false, error }))
      })
    return () => {
      stale = true
    }
  }, [key, reloadToken])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  return { ...state, reload }
}
