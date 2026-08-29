export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || ''
const THINGSPEAK_API_KEY = process.env.THINGSPEAK_API_KEY || ''

// Real weather data from OpenWeatherMap
async function fetchRealWeather(lat: number, lon: number) {
  if (!OPENWEATHER_API_KEY) return null
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    const res = await fetch(url)
    const data = await res.json()
    return {
      temperature: data.main?.temp,
      humidity: data.main?.humidity,
      windSpeed: data.wind?.speed,
      lightLevel: data.clouds?.all ? (100 - data.clouds.all) * 10 : 500,
      weather: data.weather?.[0]?.description
    }
  } catch {
    return null
  }
}

// Real soil data from SoilGrids API
async function fetchSoilData(lat: number, lon: number) {
  try {
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=phh2o&property=soc&depth=0-5cm&value=mean`
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.properties?.layers) {
      const phLayer = data.properties.layers.find((l: any) => l.name === 'phh2o')
      const socLayer = data.properties.layers.find((l: any) => l.name === 'soc')
      
      return {
        soilPH: phLayer?.depths?.[0]?.values?.mean ? phLayer.depths[0].values.mean / 10 : 6.5,
        soilOrganicCarbon: socLayer?.depths?.[0]?.values?.mean || 15,
        source: 'SoilGrids'
      }
    }
    return null
  } catch {
    return null
  }
}

// NASA POWER satellite data for agriculture
async function fetchNASAPower(lat: number, lon: number) {
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon}&latitude=${lat}&format=JSON`
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.properties?.parameter) {
      const params = data.properties.parameter
      return {
        satelliteTemp: params.T2M ? Object.values(params.T2M)[0] : null,
        satelliteHumidity: params.RH2M ? Object.values(params.RH2M)[0] : null,
        satelliteRainfall: params.PRECTOTCORR ? Object.values(params.PRECTOTCORR)[0] : null,
        satelliteSolarRadiation: params.ALLSKY_SFC_SW_DWN ? Object.values(params.ALLSKY_SFC_SW_DWN)[0] : null,
        source: 'NASA POWER'
      }
    }
    return null
  } catch {
    return null
  }
}

// Fetch from ThingSpeak (IoT sensor data)
async function fetchThingSpeak(channelId: string) {
  if (!THINGSPEAK_API_KEY) return null
  try {
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds/last.json?api_key=${THINGSPEAK_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return {
      field1: data.field1, // Temperature
      field2: data.field2, // Humidity
      field3: data.field3, // Soil Moisture
      field4: data.field4, // Light
      source: 'ThingSpeak IoT'
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const lat = body.lat || -1.2921 // Default Nairobi
    const lon = body.lon || 36.8219
    const thingSpeakChannel = body.thingSpeakChannel || ''

    // Fetch all real data sources in parallel
    const [weatherData, soilData, nasaData, iotData] = await Promise.all([
      fetchRealWeather(lat, lon),
      fetchSoilData(lat, lon),
      fetchNASAPower(lat, lon),
      thingSpeakChannel ? fetchThingSpeak(thingSpeakChannel) : Promise.resolve(null)
    ])

    const greenhouseData = {
      // Real-time weather from OpenWeatherMap
      weather: weatherData,
      // Real soil from SoilGrids
      soil: soilData,
      // Satellite from NASA POWER
      satellite: nasaData,
      // IoT sensors from ThingSpeak
      iot: iotData,
      location: { lat, lon },
      timestamp: new Date().toISOString(),
      dataSources: {
        weather: !!weatherData,
        soil: !!soilData,
        satellite: !!nasaData,
        iot: !!iotData
      }
    }

    return NextResponse.json({ success: true, data: greenhouseData })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch greenhouse data' }, { status: 500 })
  }
}