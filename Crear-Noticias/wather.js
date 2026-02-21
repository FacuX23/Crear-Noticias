// API Keys
    const WEATHERAPI_KEY = '028e4aee1a1b47e084750357243012'; // WeatherAPI para temp y humedad
    const ACCUWEATHER_KEY = 'zpka_29377efae84143d38ca810654912ab1c_634f4a00'; // AccuWeather para viento preciso
    
    // Coordenadas exactas de Concordia, Entre Ríos, Argentina
    const LATITUDE = -31.3933;
    const LONGITUDE = -58.0211;

    const loadingState = document.getElementById('loadingState');
    const weatherDataElement = document.getElementById('weatherData');
    const errorState = document.getElementById('errorState');

    // Función para obtener el SVG del icono según la condición del clima
    function getWeatherIcon(condition, isNight = false) {
        const lowerCondition = condition.toLowerCase();
        
        // Despejado / Soleado
        if (lowerCondition.includes('despejado') || lowerCondition.includes('soleado') || 
            lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
            if (isNight) {
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>`;
            }
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/>
                <path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/>
                <path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/>
                <path d="M20 12h2"/>
                <path d="m6.34 17.66-1.41 1.41"/>
                <path d="m19.07 4.93-1.41 1.41"/>
            </svg>`;
        }
        
        // Parcialmente nublado / Nublado con sol
        if (lowerCondition.includes('parcial') || lowerCondition.includes('partly') ||
            lowerCondition.includes('mostly') || lowerCondition.includes('algunas nubes')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v2"/>
                <path d="m4.93 4.93 1.41 1.41"/>
                <path d="M20 12h2"/>
                <path d="m19.07 4.93-1.41 1.41"/>
                <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/>
                <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>
            </svg>`;
        }
        
        // Tormenta eléctrica
        if (lowerCondition.includes('tormenta') || lowerCondition.includes('thunder') ||
            lowerCondition.includes('storm') || lowerCondition.includes('eléctrica')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/>
                <path d="m13 12-3 5h4l-3 5"/>
            </svg>`;
        }
        
        // Lluvia moderada / fuerte
        if (lowerCondition.includes('lluvia moderada') || lowerCondition.includes('lluvia fuerte') ||
            lowerCondition.includes('heavy rain') || lowerCondition.includes('moderate rain') ||
            lowerCondition.includes('lluvia intensa')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                <path d="M16 14v6"/>
                <path d="M8 14v6"/>
                <path d="M12 16v6"/>
            </svg>`;
        }
        
        // Llovizna / Lluvia ligera
        if (lowerCondition.includes('llovizna') || lowerCondition.includes('drizzle') ||
            lowerCondition.includes('lluvia ligera') || lowerCondition.includes('light rain') ||
            lowerCondition.includes('lluvia débil')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                <path d="M8 19v1"/>
                <path d="M8 14v1"/>
                <path d="M16 19v1"/>
                <path d="M16 14v1"/>
                <path d="M12 21v1"/>
                <path d="M12 16v1"/>
            </svg>`;
        }

        // Nublado con Luna
        if (lowerCondition.includes('nublado con luna') || lowerCondition.includes('cloud moon')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-moon-icon lucide-cloud-moon"><path d="M13 16a3 3 0 0 1 0 6H7a5 5 0 1 1 4.9-6z"/><path d="M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36"/></svg>`;
        }

        // Niebla
        if (lowerCondition.includes('niebla') || lowerCondition.includes('mist') || lowerCondition.includes('misty')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-fog-icon lucide-cloud-fog"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 17H7"/><path d="M17 21H9"/></svg>`;
        }

        // Nublado (por defecto)
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
        </svg>`;
    }

    // Función para actualizar el icono del clima
    function updateWeatherIcon(condition) {
        const hour = new Date().getHours();
        const isNight = hour >= 20 || hour < 6;
        const iconHTML = getWeatherIcon(condition, isNight);
        document.getElementById('weatherIcon').innerHTML = iconHTML;
    }

    // Función para obtener el pronóstico de 3 días
    async function loadForecast() {
        try {
            const response = await fetch(
                `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${LATITUDE},${LONGITUDE}&days=3&lang=es`
            );

            if (!response.ok) {
                throw new Error('Error al cargar pronóstico');
            }

            const data = await response.json();
            displayForecast(data.forecast.forecastday);
            
        } catch (error) {
            console.error('Error al cargar pronóstico:', error);
        }
    }

    // Función para mostrar el pronóstico en las cards
    function displayForecast(forecastDays) {
        const forecastGrid = document.getElementById('forecastDaysGrid');
        if (!forecastGrid) return;
        
        forecastGrid.innerHTML = ''; // Limpiar contenido previo
        
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diasSemanaCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        forecastDays.forEach((day, index) => {
            const date = new Date(day.date);
            const diaActual = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
            
            // Obtener el nombre del día siguiente al actual
            let diaSiguiente = (diaActual + index + 1) % 7;
            const dayName = diasSemanaCortos[diaSiguiente];
            
            const card = document.createElement('div');
            card.className = 'forecast-day-card';
            card.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-icon">
                    ${getWeatherIcon(day.day.condition.text)}
                </div>
                <div class="day-temp">${Math.round(day.day.maxtemp_c)}°</div>
                <div class="day-condition">${day.day.condition.text}</div>
                <div class="day-details">
                    <div class="day-detail-item">
                        <span class="day-detail-label">Viento</span>
                        <span class="day-detail-value">${Math.round(day.day.maxwind_kph)} km/h</span>
                    </div>
                    <div class="day-detail-item">
                        <span class="day-detail-label">Humedad</span>
                        <span class="day-detail-value">${day.day.avghumidity}%</span>
                    </div>
                </div>
            `;
            
            forecastGrid.appendChild(card);
        });
    }

    // Cargar datos del clima combinando WeatherAPI y AccuWeather
    async function loadWeather() {
        try {
            // 1. Obtener temperatura y humedad de WeatherAPI
            const weatherResponse = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${LATITUDE},${LONGITUDE}&lang=es`
            );

            if (!weatherResponse.ok) {
                throw new Error('Error al cargar datos básicos del clima');
            }

            const weatherInfo = await weatherResponse.json();
            const current = weatherInfo.current;

            // Actualizar temperatura, descripción y humedad
            document.getElementById('temperature').textContent = 
                `${Math.round(current.temp_c)}°C`;
            document.getElementById('description').textContent = 
                current.condition.text;
            document.getElementById('humidity').textContent = 
                `${current.humidity}%`;

            // Actualizar icono del clima según la condición
            updateWeatherIcon(current.condition.text);

            // 2. Intentar obtener datos precisos de viento de AccuWeather API
            let windFromAccuWeather = false;
            let accuWeatherDebugInfo = {};
            
            if (ACCUWEATHER_KEY !== 'TU_ACCUWEATHER_API_KEY_AQUI') {
                console.log('🔍 Intentando obtener datos de AccuWeather...');
                try {
                    // Paso 1: Obtener el Location Key de AccuWeather usando coordenadas
                    console.log(`📍 Buscando Location Key para: ${LATITUDE}, ${LONGITUDE}`);
                    const locationResponse = await fetch(
                        `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_KEY}&q=${LATITUDE},${LONGITUDE}&language=es-ar`
                    );

                    if (locationResponse.ok) {
                        const locationData = await locationResponse.json();
                        const locationKey = locationData.Key;
                        console.log(`✅ Location Key obtenido: ${locationKey} (${locationData.LocalizedName})`);

                        // Paso 2: Obtener condiciones actuales con el Location Key
                        const currentConditionsResponse = await fetch(
                            `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_KEY}&language=es-ar&details=true`
                        );

                        if (currentConditionsResponse.ok) {
                            const conditionsData = await currentConditionsResponse.json();
                            const accuWeatherCurrent = conditionsData[0];
                            
                            console.log('📦 Datos raw de AccuWeather:', accuWeatherCurrent);
                            
                            // AccuWeather devuelve viento en MÚLTIPLES unidades
                            // Asegurar que usamos SOLO Metric (km/h)
                            let windKph;
                            
                            if (accuWeatherCurrent.Wind?.Speed?.Metric?.Value !== undefined) {
                                windKph = Math.round(accuWeatherCurrent.Wind.Speed.Metric.Value);
                            } else if (accuWeatherCurrent.Wind?.Speed?.Imperial?.Value !== undefined) {
                                // Si solo hay Imperial (mph), convertir a km/h
                                const windMph = accuWeatherCurrent.Wind.Speed.Imperial.Value;
                                windKph = Math.round(windMph * 1.60934);
                                console.warn('⚠️ AccuWeather solo devolvió mph, convertido a km/h');
                            } else {
                                throw new Error('AccuWeather no devolvió datos de viento');
                            }
                            
                            const windDirection = accuWeatherCurrent.Wind?.Direction?.Localized || 'N/A';
                            
                            // Ráfagas también en km/h
                            let gustKph = null;
                            if (accuWeatherCurrent.WindGust?.Speed?.Metric?.Value !== undefined) {
                                gustKph = Math.round(accuWeatherCurrent.WindGust.Speed.Metric.Value);
                            } else if (accuWeatherCurrent.WindGust?.Speed?.Imperial?.Value !== undefined) {
                                const gustMph = accuWeatherCurrent.WindGust.Speed.Imperial.Value;
                                gustKph = Math.round(gustMph * 1.60934);
                            }
                            
                            // Actualizar UI
                            document.getElementById('windSpeed').textContent = 
                                `${windKph} km/h`;
                            windFromAccuWeather = true;

                            accuWeatherDebugInfo = {
                                viento_kph: windKph,
                                direccion: windDirection,
                                rafagas_kph: gustKph,
                                temperatura_accuweather: accuWeatherCurrent.Temperature?.Metric?.Value || 'N/A',
                                humedad_accuweather: accuWeatherCurrent.RelativeHumidity || 'N/A',
                                ubicacion: locationData.LocalizedName
                            };

                            console.log('✅✅✅ USANDO ACCUWEATHER - Datos precisos:', accuWeatherDebugInfo);
                        } else {
                            const errorText = await currentConditionsResponse.text();
                            console.error('❌ AccuWeather conditions rechazada:', currentConditionsResponse.status, errorText);
                        }
                    } else {
                        const errorText = await locationResponse.text();
                        console.error('❌ AccuWeather location rechazada:', locationResponse.status, errorText);
                    }
                } catch (accuWeatherError) {
                    console.error('❌ AccuWeather API error completo:', accuWeatherError);
                }
            } else {
                console.warn('⚠️⚠️⚠️ NO CONFIGURASTE LA API KEY DE ACCUWEATHER');
                console.warn('Busca en el código: const ACCUWEATHER_KEY = "TU_ACCUWEATHER_API_KEY_AQUI"');
            }
            
            // Fallback a WeatherAPI si AccuWeather no funcionó
            if (!windFromAccuWeather) {
                // WeatherAPI ya devuelve en km/h, no necesita conversión
                document.getElementById('windSpeed').textContent = 
                    `${Math.round(current.wind_kph)} km/h`;
                console.warn('⚠️⚠️⚠️ USANDO WEATHERAPI para viento (menos preciso)');
                console.warn('Viento WeatherAPI:', current.wind_kph, 'km/h');
            }

            // Log comparativo FINAL
            console.log('═══════════════════════════════════════════════');
            console.log('📊 RESUMEN FINAL - Fuente de datos:', 
                windFromAccuWeather ? '✅ AccuWeather (MUY PRECISO)' : '⚠️ WeatherAPI (APROXIMADO)');
            console.log('═══════════════════════════════════════════════');
            console.log('Temperatura:', current.temp_c, '°C');
            console.log('Humedad:', current.humidity, '%');
            console.log('Viento WeatherAPI:', current.wind_kph, 'km/h');
            if (windFromAccuWeather) {
                console.log('Viento AccuWeather:', accuWeatherDebugInfo.viento_kph, 'km/h ⭐ USANDO ESTE');
                console.log('Dirección:', accuWeatherDebugInfo.direccion);
                if (accuWeatherDebugInfo.rafagas_kph) {
                    console.log('Ráfagas:', accuWeatherDebugInfo.rafagas_kph, 'km/h');
                }
            }
            console.log('Ubicación:', weatherInfo.location.name);
            console.log('═══════════════════════════════════════════════');

            // Mostrar datos y ocultar loading (CON VERIFICACIÓN)
            if (loadingState) {
                loadingState.classList.add('hidden');
            }
            if (weatherDataElement) {
                weatherDataElement.classList.remove('hidden');
            }

            // Cargar pronóstico de 5 días
            loadForecast();

        } catch (error) {
            console.error('❌ Error:', error);
            if (loadingState) {
                loadingState.classList.add('hidden');
            }
            if (errorState) {
                errorState.classList.remove('hidden');
            }
        }
    }

    // Cargar datos al iniciar la página
    loadWeather();

    // ========================================
    // TOGGLE PRONÓSTICO EXTENDIDO
    // ========================================

    const forecastToggle = document.getElementById('forecastToggle');
    const forecastExtended = document.getElementById('forecastExtended');

    if (forecastToggle && forecastExtended) {
        forecastToggle.addEventListener('click', () => {
            forecastToggle.classList.toggle('active');
            forecastExtended.classList.toggle('show');
            
            // Cambiar texto del botón
            const buttonText = forecastToggle.childNodes[0];
            if (forecastExtended.classList.contains('show')) {
                buttonText.textContent = 'Ocultar pronóstico ';
            } else {
                buttonText.textContent = 'Ver los siguientes días ';
            }
        });
    }

    // Manejar clicks en las cards de pronóstico
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.forecast-day-card');
        if (card) {
            // Remover active de todas las cards
            document.querySelectorAll('.forecast-day-card').forEach(c => {
                if (c !== card) c.classList.remove('active');
            });
            // Toggle active en la card clickeada
            card.classList.toggle('active');
        }
    });

    // Función para mostrar el pronóstico en las cards
function displayForecast(forecastDays) {
    const forecastGrid = document.getElementById('forecastDaysGrid');
    if (!forecastGrid) return;
    
    forecastGrid.innerHTML = ''; // Limpiar contenido previo
    
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasSemanaCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    forecastDays.forEach((day, index) => {
        const date = new Date(day.date);
        const diaActual = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
        
        // Obtener el nombre del día siguiente al actual
        let diaSiguiente = (diaActual + index + 1) % 7;
        const dayNameShort = diasSemanaCortos[diaSiguiente];
        const dayNameFull = diasSemana[diaSiguiente];
        
        const card = document.createElement('div');
        card.className = 'forecast-day-card';
        // En la función displayForecast() - cambiar el orden de los elementos
card.innerHTML = `
    <div class="card-header">
        <div class="day-name">
            <span class="day-name-short">${dayNameShort}</span>
            <span class="day-name-full">${dayNameFull}</span>
        </div>
    </div>
    <div class="day-icon-container">
        <div class="day-icon">
            ${getWeatherIcon(day.day.condition.text)}
        </div>
    </div>
    <div class="day-temp">${Math.round(day.day.maxtemp_c)}°</div>
    <div class="day-details">
        <div class="day-condition">${day.day.condition.text}</div>
        <div class="day-info-grid">
            <div class="day-detail-item">
                <div class="day-detail-label">Viento:</div>
                <div class="day-detail-value">${Math.round(day.day.maxwind_kph)} km/h</div>
            </div>
            <div class="day-detail-item">
                <div class="day-detail-label">Humedad:</div>
                <div class="day-detail-value">${day.day.avghumidity}%</div>
            </div>
        </div>
    </div>
    <div class="gradient-overlay"></div>
`;
        
        forecastGrid.appendChild(card);
    });
}