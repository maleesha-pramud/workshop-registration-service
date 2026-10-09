import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from './navigation'

export default function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={homePathFor(user)} replace />
}
