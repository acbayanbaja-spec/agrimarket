export const REGION_NAME = 'SOCCSKSARGEN'

export const ID_DOCUMENT_TYPES = [
  'Philippine Passport',
  'PhilID (National ID)',
  "Driver's License",
  'UMID',
  'Postal ID',
  "Voter's ID",
  'PRC ID',
] as const

export type SoccsksargenPlace = {
  city: string
  province: string
  label: string
  lat: number
  lng: number
}

export const soccsksargenPlaces: SoccsksargenPlace[] = [
  { city: 'Koronadal City', province: 'South Cotabato', label: 'Koronadal City, South Cotabato', lat: 6.5004, lng: 124.8436 },
  { city: 'Polomolok', province: 'South Cotabato', label: 'Polomolok, South Cotabato', lat: 6.2214, lng: 125.0647 },
  { city: 'Tupi', province: 'South Cotabato', label: 'Tupi, South Cotabato', lat: 6.3347, lng: 124.9528 },
  { city: 'Surallah', province: 'South Cotabato', label: 'Surallah, South Cotabato', lat: 6.3753, lng: 124.7456 },
  { city: "Lake Sebu", province: 'South Cotabato', label: 'Lake Sebu, South Cotabato', lat: 6.224, lng: 124.706 },
  { city: 'General Santos City', province: 'General Santos', label: 'General Santos City', lat: 6.1164, lng: 125.1716 },
  { city: 'Isulan', province: 'Sultan Kudarat', label: 'Isulan, Sultan Kudarat', lat: 6.6294, lng: 124.605 },
  { city: 'Tacurong City', province: 'Sultan Kudarat', label: 'Tacurong City, Sultan Kudarat', lat: 6.6925, lng: 124.6764 },
  { city: 'President Quirino', province: 'Sultan Kudarat', label: 'President Quirino, Sultan Kudarat', lat: 6.6964, lng: 124.7339 },
  { city: 'Alabel', province: 'Sarangani', label: 'Alabel, Sarangani', lat: 6.1022, lng: 125.2906 },
  { city: 'Glan', province: 'Sarangani', label: 'Glan, Sarangani', lat: 5.8225, lng: 125.2036 },
  { city: 'Kiamba', province: 'Sarangani', label: 'Kiamba, Sarangani', lat: 5.9897, lng: 124.6242 },
  { city: 'Kidapawan City', province: 'Cotabato', label: 'Kidapawan City, Cotabato', lat: 7.0083, lng: 125.0894 },
  { city: 'Midsayap', province: 'Cotabato', label: 'Midsayap, Cotabato', lat: 7.1906, lng: 124.5381 },
  { city: "M'lang", province: 'Cotabato', label: "M'lang, Cotabato", lat: 6.9467, lng: 124.8803 },
]

export const defaultPlace = soccsksargenPlaces[0]

export function findPlace(label: string) {
  return soccsksargenPlaces.find((place) => place.label === label || place.city === label) || defaultPlace
}
