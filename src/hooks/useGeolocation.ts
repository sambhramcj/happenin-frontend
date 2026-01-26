import { useState, useEffect } from 'react'
import { getUserLocation } from '@/lib/geolocation'

interface Location {
  latitude: number
  longitude: number
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    getUserLocation()
      .then(setLocation)
      .catch((err) => {
        if (err.code === 1) {
          // User denied permission
          setPermissionDenied(true)
        }
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  return { location, error, loading, permissionDenied }
}
