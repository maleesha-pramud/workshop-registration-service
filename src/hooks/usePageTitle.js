import { useEffect } from 'react'

const APP_NAME = 'Workshop Desk'

/** Sets the browser tab title to "<title> · Workshop Desk". */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
