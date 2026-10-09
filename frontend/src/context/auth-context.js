import { createContext } from 'react'

// The context object lives in its own file so AuthProvider.jsx only exports a component.
// Use the `useAuth()` hook (hooks/useAuth.js) to read it.
export const AuthContext = createContext(null)
