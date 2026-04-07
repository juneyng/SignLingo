import { useState, useEffect } from 'react'
import { onAuthStateChanged } from '../services/auth'
import useStore from '../stores/useStore'

export default function useAuth() {
  const { user, setUser } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const subscription = onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  return { user, loading }
}
