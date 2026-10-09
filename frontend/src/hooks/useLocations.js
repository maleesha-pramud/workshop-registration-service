import { locationsApi } from '../api/endpoints'
import { useApi } from './useApi'

export function useLocations() {
  const { data } = useApi(() => locationsApi.list(), [])
  return data ?? []
}
