import { createContext } from 'react'

// Kept separate from ToastProvider.jsx so that file only exports a component.
// Use the `useToast()` hook (hooks/useToast.js) to read it.
export const ToastContext = createContext(null)
