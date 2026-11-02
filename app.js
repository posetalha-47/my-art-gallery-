import { fetchWeatherData, CITIES_DB, getApiKey, setApiKey } from './api.js';

const state = {
  currentData: null,
  isFahrenheit: false,
  favourites: JSON.parse(localStorage.getItem('wn_favourites')) || ['Lahore, PK', 'London, GB']
};

let chartInstance = null;
let debounceTimer = null;

const DOM = {
  searchInput: document.getElementById('searchInput'),
  clearSearch: document.getElementById('clearSearch'),
  autocompleteResults: document.getElementById('autocompleteResults'),
  geoBtn: document.getElementById('geoBtn'),
  unitToggle: document.getElementById('unitToggle'),
  favBtn: document.getElementById('favBtn'),
  favouritesList: document.getElementById('favouritesList'),
  toast: document.getElementById('toast'),
  cityName: document.getElementById('cityName'),
  currentDate: document.getElementById('currentDate'),
  tempVal: document.getElementById('tempVal'),
  weatherIcon: document.getElementById('weatherIcon'),
  weatherDesc: document.getElementById('weatherDesc'),
  feelsLike: document.getElementById('feelsLike'),
  humidityVal: document.getElementById('humidityVal'),
  windVal: document.getElementById('windVal'),
  pressureVal: document.getElementById('pressureVal'),
  sunTimes: document.getElementById('sunTimes'),
  aqiBadge: document.getElementById('aqiBadge'),
  aqiVal: document.getElementById('aqiVal'),
  aqiAdvice: document.getElementById('aqiAdvice'),
  forecastContainer: document.getElementById('forecastContainer'),
  apiKeyBtn: document.getElementById('apiKeyBtn'),
  apiModal: document.getElementById('apiModal'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveApiKey: document.getElementById('saveApiKey'),
  closeModal: document.getElementById('closeModal')
};

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderFavourites();
  loadCityData('Lahore, PK');
});

function setupEventListeners() {
  DOM.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    DOM.clearSearch.classList.toggle('hidden', val.length === 0);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleSearchAutocomplete(val), 300);
  });

  DOM.clearSearch.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.clearSearch.classList.add('hidden');
    DOM.autocompleteResults.classList.add('hidden');
  });

  DOM.geoBtn.addEventListener('click', handleGeolocation);

  DOM.unitToggle.addEventListener('change', (e) => {
    state.isFahrenheit = e.target.checked;
    renderUI();
  });

  DOM.favBtn.addEventListener('click', toggleFavourite);

  DOM.apiKeyBtn.addEventListener('click', () => {
    DOM.apiKeyInput.value = getApiKey();
    DOM.apiModal.classList.remove('hidden');
  });

  DOM.closeModal.addEventListener('click', () => DOM.apiModal.classList.add('hidden'));

  DOM.saveApiKey.addEventListener('click', () => {
    setApiKey(DOM.apiKeyInput.value);
    DOM.apiModal.classList.add('hidden');
    showToast('API Key saved successfully!');
    if (state.currentData) loadCityData(state.currentData.city);
  });
}

async function loadCityData(query) {
  try {
    const data = await fetchWeatherData(query);
    state.currentData = data;
    updateTheme(data.condition);
    renderUI();
  } catch (err) {
    showToast('Error fetching weather data.');
  }
}

function renderUI() {
  const d = state.currentData;
  if (!d) return;

  DOM.cityName.textContent = d.city;
  DOM.currentDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  
  DOM.tempVal.textContent = convertTemp(d.temp);
  DOM.feelsLike.textContent = `Feels like: ${convertTemp(d.feelsLike)}°${state.isFahrenheit ? 'F' : 'C'}`;
  
  DOM.weatherIcon.src = d.icon;
  DOM.weatherDesc.textContent = d.description;
  DOM.humidityVal.textContent = `${d.humidity}%`;
  DOM.windVal.textContent = `${d.wind} km/h`;
  DOM.pressureVal.textContent = `${d.pressure} hPa`;
  DOM.sunTimes.textContent = `${d.sunrise} / ${d.sunset}`;

  renderAQI(d.aqi);

  const isFav = state.favourites.includes(d.city);
  DOM.favBtn.innerHTML = isFav ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';

  renderChart(d.hourly);
  renderForecast(d.daily);
}

function convertTemp(tempC) {
  return state.isFahrenheit ? Math.round((tempC * 9) / 5 + 32) : tempC;
}

function updateTheme(condition) {
  document.body.className = '';
  const cond = condition.toLowerCase();
  
  if (cond.includes('clear')) document.body.classList.add('theme-clear');
  else if (cond.includes('cloud')) document.body.classList.add('theme-clouds');
  else if (cond.includes('rain')) document.body.classList.add('theme-rain');
  else if (cond.includes('thunder')) document.body.classList.add('theme-thunderstorm');
  else if (cond.includes('snow')) document.body.classList.add('theme-snow');
  else document.body.classList.add('theme-mist');
}

function handleSearchAutocomplete(query) {
  if (query.length < 2) {
    DOM.autocompleteResults.classList.add('hidden');
    return;
  }

  const matches = CITIES_DB.filter(c => c.toLowerCase().includes(query.toLowerCase()));
  
  if (matches.length === 0) {
    DOM.autocompleteResults.classList.add('hidden');
    return;
  }

  DOM.autocompleteResults.innerHTML = matches.map(city => `<li>${city}</li>`).join('');
  DOM.autocompleteResults.classList.remove('hidden');

  DOM.autocompleteResults.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      DOM.searchInput.value = item.textContent;
      DOM.autocompleteResults.classList.add('hidden');
      loadCityData(item.textContent);
    });
  });
}

function handleGeolocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.');
    return;
  }

  showToast('Locating...');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      loadCityData({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    },
    () => {
      showToast('Location permission denied.');
    }
  );
}

function renderAQI(score) {
  const levels = [
    { label: 'Good', class: 'status-good', advice: 'Air quality is ideal for outdoor activities.' },
    { label: 'Moderate', class: 'status-moderate', advice: 'Air quality is acceptable.' },
    { label: 'Unhealthy', class: 'status-unhealthy', advice: 'Consider reducing outdoor exercises.' }
  ];

  const current = levels[score - 1] || levels[0];
  DOM.aqiBadge.textContent = current.label;
  DOM.aqiBadge.className = `aqi-badge ${current.class}`;
  DOM.aqiVal.textContent = `AQI Index: ${score}`;
  DOM.aqiAdvice.textContent = current.advice;
}

function renderChart(hourly) {
  const ctx = document.getElementById('hourlyChart').getContext('2d');
  const labels = hourly.map(h => h.time);
  const dataPoints = hourly.map(h => convertTemp(h.temp));

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `Temp (°${state.isFahrenheit ? 'F' : 'C'})`,
        data: dataPoints,
        borderColor: '#ffd166',
        backgroundColor: 'rgba(255, 209, 102, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { display: false } },
        y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
      }
    }
  });
}

function renderForecast(daily) {
  DOM.forecastContainer.innerHTML = daily.map(d => `
    <div class="forecast-item">
      <span class="day">${d.day}</span>
      <img src="${d.icon}" alt="Weather">
      <span class="temp">${convertTemp(d.temp)}°${state.isFahrenheit ? 'F' : 'C'}</span>
    </div>
  `).join('');
}

function toggleFavourite() {
  const city = state.currentData?.city;
  if (!city) return;

  const index = state.favourites.indexOf(city);
  if (index > -1) {
    state.favourites.splice(index, 1);
    showToast('Removed from favourites.');
  } else {
    state.favourites.push(city);
    showToast('Saved to favourites!');
  }

  localStorage.setItem('wn_favourites', JSON.stringify(state.favourites));
  renderFavourites();
  renderUI();
}

function renderFavourites() {
  if (state.favourites.length === 0) {
    DOM.favouritesList.innerHTML = '<li class="empty-favs">No saved cities yet.</li>';
    return;
  }

  DOM.favouritesList.innerHTML = state.favourites.map(city => `
    <li class="fav-item" data-city="${city}">
      <span>${city}</span>
      <i class="fa-solid fa-xmark remove-fav"></i>
    </li>
  `).join('');

  DOM.favouritesList.querySelectorAll('.fav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const city = item.dataset.city;
      if (e.target.classList.contains('remove-fav')) {
        state.favourites = state.favourites.filter(c => c !== city);
        localStorage.setItem('wn_favourites', JSON.stringify(state.favourites));
        renderFavourites();
      } else {
        loadCityData(city);
      }
    });
  });
}

function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.remove('hidden');
  setTimeout(() => DOM.toast.classList.add('hidden'), 3000);
}