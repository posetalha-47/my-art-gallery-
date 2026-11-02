const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const CITIES_DB = [
  "Lahore, PK", "Karachi, PK", "Islamabad, PK", "London, GB",
  "New York, US", "Tokyo, JP", "Paris, FR", "Dubai, AE",
  "Sydney, AU", "Berlin, DE", "Toronto, CA", "Istanbul, TR"
];

export function getApiKey() {
  return localStorage.getItem('wn_api_key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('wn_api_key', key.trim());
}

export async function fetchWeatherData(query) {
  const apiKey = getApiKey();
  
  if (apiKey) {
    try {
      const isCoords = typeof query === 'object';
      const weatherUrl = isCoords 
        ? `${BASE_URL}/weather?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${apiKey}`
        : `${BASE_URL}/weather?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`;
      
      const forecastUrl = isCoords
        ? `${BASE_URL}/forecast?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${apiKey}`
        : `${BASE_URL}/forecast?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`;

      const [weatherRes, forecastRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
      ]);

      if (!weatherRes.ok || !forecastRes.ok) throw new Error('API Error');

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      return formatLiveData(weatherData, forecastData);
    } catch (error) {
      console.warn("API Call Failed, falling back to mock data engine:", error.message);
    }
  }

  return generateMockData(typeof query === 'string' ? query : 'Current Location');
}

function formatLiveData(weather, forecast) {
  return {
    city: `${weather.name}, ${weather.sys.country}`,
    temp: Math.round(weather.main.temp),
    feelsLike: Math.round(weather.main.feels_like),
    humidity: weather.main.humidity,
    wind: Math.round(weather.wind.speed * 3.6),
    pressure: weather.main.pressure,
    condition: weather.weather[0].main,
    description: weather.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`,
    sunrise: new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sunset: new Date(weather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    aqi: Math.floor(Math.random() * 3) + 1,
    hourly: forecast.list.slice(0, 8).map(item => ({
      time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(item.main.temp)
    })),
    daily: forecast.list.filter((_, idx) => idx % 8 === 0).slice(0, 5).map(item => ({
      day: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      temp: Math.round(item.main.temp),
      icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
    }))
  };
}

function generateMockData(cityName) {
  const baseTemp = Math.floor(Math.random() * 15) + 14;
  const conditions = [
    { main: 'Clear', desc: 'Sunny & Clear', icon: '01d' },
    { main: 'Clouds', desc: 'Partly Cloudy', icon: '03d' },
    { main: 'Rain', desc: 'Moderate Rain', icon: '10d' },
    { main: 'Thunderstorm', desc: 'Thunderstorms', icon: '11d' }
  ];
  const cond = conditions[Math.floor(Math.random() * conditions.length)];

  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        city: cityName.includes(',') ? cityName : `${cityName}, Global`,
        temp: baseTemp,
        feelsLike: baseTemp - 1,
        humidity: 65,
        wind: 12,
        pressure: 1013,
        condition: cond.main,
        description: cond.desc,
        icon: `https://openweathermap.org/img/wn/${cond.icon}@4x.png`,
        sunrise: "06:15 AM",
        sunset: "06:45 PM",
        aqi: Math.floor(Math.random() * 3) + 1,
        hourly: Array.from({ length: 8 }).map((_, i) => ({
          time: `${(i * 3 + 6) % 24}:00`,
          temp: baseTemp + Math.floor(Math.sin(i) * 4)
        })),
        daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => ({
          day,
          temp: baseTemp + Math.floor(Math.random() * 5) - 2,
          icon: `https://openweathermap.org/img/wn/${cond.icon}@2x.png`
        }))
      });
    }, 250);
  });
}