import { supabase } from './supabase'

export interface College {
  id: string
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  college_type: string
  website_url?: string
  logo_url?: string
  distance?: number
}

// Haversine formula - calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number) {
  return deg * (Math.PI / 180)
}

// Get nearby colleges within radius
export async function getNearbyColleges(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<College[]> {
  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (error) {
    console.error('Error fetching colleges:', error)
    return []
  }

  // Client-side filtering using Haversine
  return (data as College[])
    .map((college) => ({
      ...college,
      distance: calculateDistance(
        latitude,
        longitude,
        college.latitude,
        college.longitude
      ),
    }))
    .filter((college) => college.distance! <= radiusKm)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

// Get student's favorite colleges
export async function getFavoriteColleges(studentEmail: string) {
  const { data, error } = await supabase
    .from('favorite_colleges')
    .select('college_id, colleges(*)')
    .eq('student_email', studentEmail)

  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }

  return data
}

// Add college to favorites
export async function addFavoriteCollege(
  studentEmail: string,
  collegeId: string
) {
  return supabase.from('favorite_colleges').insert({
    student_email: studentEmail,
    college_id: collegeId,
  })
}

// Remove college from favorites
export async function removeFavoriteCollege(
  studentEmail: string,
  collegeId: string
) {
  return supabase
    .from('favorite_colleges')
    .delete()
    .eq('student_email', studentEmail)
    .eq('college_id', collegeId)
}

// ===== FAVORITE EVENTS =====

// Get student's favorite events
export async function getFavoriteEvents(studentEmail: string) {
  const { data, error } = await supabase
    .from('favorite_events')
    .select('event_id, events(*)')
    .eq('student_email', studentEmail)

  if (error) {
    console.error('Error fetching favorite events:', error)
    return []
  }

  return data
}

// Add event to favorites
export async function addFavoriteEvent(
  studentEmail: string,
  eventId: string
) {
  return supabase.from('favorite_events').insert({
    student_email: studentEmail,
    event_id: eventId,
  })
}

// Remove event from favorites
export async function removeFavoriteEvent(
  studentEmail: string,
  eventId: string
) {
  return supabase
    .from('favorite_events')
    .delete()
    .eq('student_email', studentEmail)
    .eq('event_id', eventId)
}

// Get user's current location
export function getUserLocation(): Promise<{
  latitude: number
  longitude: number
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      }
    )
  })
}
