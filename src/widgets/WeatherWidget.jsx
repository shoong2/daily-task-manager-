import { useState, useEffect } from 'react'

const DEFAULT_LAT = 37.5665
const DEFAULT_LON = 126.9780
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

const WEATHER_EMOJI = {
  '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
  '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️',
}

function getEmoji(icon) {
  return WEATHER_EMOJI[icon?.slice(0, 2)] ?? '🌡️'
}

function getPM25Grade(pm25) {
  if (pm25 <= 15) return { label: '좋음', color: 'text-green-500' }
  if (pm25 <= 35) return { label: '보통', color: 'text-yellow-500' }
  if (pm25 <= 75) return { label: '나쁨', color: 'text-orange-500' }
  return { label: '매우나쁨', color: 'text-red-500' }
}

async function fetchWeather(lat, lon) {
  const [currentRes, forecastRes, airRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
  ])
  if (!currentRes.ok) throw new Error(`날씨 API 오류 (${currentRes.status})`)
  const [current, forecast, air] = await Promise.all([currentRes.json(), forecastRes.json(), airRes.json()])
  return { current, forecast, air }
}

function getTimeSlots(forecastList) {
  const slots = { morning: null, afternoon: null, evening: null }
  for (const item of forecastList) {
    const h = new Date(item.dt * 1000).getHours()
    if (!slots.morning && h >= 6 && h < 12) slots.morning = item
    if (!slots.afternoon && h >= 12 && h < 18) slots.afternoon = item
    if (!slots.evening && h >= 18 && h < 24) slots.evening = item
    if (slots.morning && slots.afternoon && slots.evening) break
  }
  return [
    { label: '오전', data: slots.morning },
    { label: '낮', data: slots.afternoon },
    { label: '저녁', data: slots.evening },
  ]
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!API_KEY || API_KEY.startsWith('your_')) { setError('날씨 API 키를 설정해주세요'); return }

    function load(lat, lon) {
      fetchWeather(lat, lon)
        .then(setWeather)
        .catch(() => setError('날씨 정보를 불러오지 못했습니다'))
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => load(pos.coords.latitude, pos.coords.longitude),
        () => load(DEFAULT_LAT, DEFAULT_LON),
      )
    } else {
      load(DEFAULT_LAT, DEFAULT_LON)
    }
  }, [])

  if (error) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">날씨</p>
      <p className="text-sm text-gray-400">{error}</p>
    </div>
  )

  if (!weather) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-16 mb-4" />
      <div className="h-8 bg-gray-100 rounded w-24 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-32" />
    </div>
  )

  const { current, forecast, air } = weather
  const temp = Math.round(current.main.temp)
  const icon = current.weather[0]?.icon
  const desc = current.weather[0]?.description
  const pm25 = air.list?.[0]?.components?.pm2_5 ?? 0
  const pm25Grade = getPM25Grade(pm25)
  const slots = getTimeSlots(forecast.list ?? [])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
        날씨 · {current.name}
      </p>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{getEmoji(icon)}</span>
        <div>
          <p className="text-4xl font-black text-gray-900 leading-none">{temp}°</p>
          <p className="text-sm text-gray-500 mt-1">{desc}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {slots.map(({ label, data }) => data ? (
          <div key={label} className="text-center">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-base">{getEmoji(data.weather[0]?.icon)}</p>
            <p className="text-sm text-gray-600 font-medium">{Math.round(data.main.temp)}°</p>
          </div>
        ) : null)}
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
        <span className="text-sm text-gray-500">미세먼지 PM2.5</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${pm25Grade.label === '좋음' ? 'bg-green-400' : pm25Grade.label === '보통' ? 'bg-yellow-400' : 'bg-red-400'}`} />
          <span className={`text-sm font-semibold ${pm25Grade.color}`}>
            {pm25Grade.label} {Math.round(pm25)}㎍
          </span>
        </div>
      </div>
    </div>
  )
}
