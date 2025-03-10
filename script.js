const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let matchLayer = null;
let cityMarkersLayer = null;

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const sliders = {
        highTemp: document.getElementById('slider-high-temp'),
        lowTemp: document.getElementById('slider-low-temp'),
        overallTemp: document.getElementById('slider-overall-temp'),
        sunlight: document.getElementById('slider-sunlight'),
        cloudy: document.getElementById('slider-cloudy')
    };

    const ranges = {
        highTemp: [14, 122],
        lowTemp: [-4, 104],
        overallTemp: [5, 113],
        sunlight: [0, 12],
        cloudy: [0, 31]
    };

    let filterValues = {};

    Object.keys(sliders).forEach(key => {
        noUiSlider.create(sliders[key], {
            start: ranges[key],
            connect: true,
            range: { 'min': ranges[key][0], 'max': ranges[key][1] },
            step: 1,
            tooltips: {
                to: val => Math.round(val),
                from: val => Number(val)
            },
            format: {
                to: val => Math.round(val),
                from: val => Number(val)
            }
        });
        
        const debouncedUpdate = debounce(() => {
            updateFilterValues();
            updateMap();
        }, 150);
        
        sliders[key].noUiSlider.on('update', debouncedUpdate);
    });

    function updateFilterValues() {
        filterValues = {
            highTemp: sliders.highTemp.noUiSlider.get().map(Number),
            lowTemp: sliders.lowTemp.noUiSlider.get().map(Number),
            overallTemp: sliders.overallTemp.noUiSlider.get().map(Number),
            sunlight: sliders.sunlight.noUiSlider.get().map(Number),
            cloudy: sliders.cloudy.noUiSlider.get().map(Number)
        };
    }

    function calculateMatchScore(point) {
        // Calculate how well this point matches the filter criteria
        // 1.0 means perfect match, 0.0 means no match at all
        
        // Check if the point is within all filter ranges
        const inRange = 
            point.highTemp >= filterValues.highTemp[0] && point.highTemp <= filterValues.highTemp[1] &&
            point.lowTemp >= filterValues.lowTemp[0] && point.lowTemp <= filterValues.lowTemp[1] &&
            point.avgTemp >= filterValues.overallTemp[0] && point.avgTemp <= filterValues.overallTemp[1] &&
            point.sunlight >= filterValues.sunlight[0] && point.sunlight <= filterValues.sunlight[1] &&
            point.cloudyDays >= filterValues.cloudy[0] && point.cloudyDays <= filterValues.cloudy[1];
        
        if (!inRange) return 0;
        
        // Calculate how close the point is to the middle of each range
        const highTempRange = filterValues.highTemp[1] - filterValues.highTemp[0];
        const lowTempRange = filterValues.lowTemp[1] - filterValues.lowTemp[0];
        const overallTempRange = filterValues.overallTemp[1] - filterValues.overallTemp[0];
        const sunlightRange = filterValues.sunlight[1] - filterValues.sunlight[0];
        const cloudyRange = filterValues.cloudy[1] - filterValues.cloudy[0];
        
        // If any range is very narrow, it means the user is being very specific
        // We'll give more weight to narrow ranges
        const weights = {
            highTemp: 1 / Math.max(highTempRange, 5),
            lowTemp: 1 / Math.max(lowTempRange, 5),
            overallTemp: 1 / Math.max(overallTempRange, 5),
            sunlight: 1 / Math.max(sunlightRange, 1),
            cloudy: 1 / Math.max(cloudyRange, 2)
        };
        
        // Normalize weights
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        Object.keys(weights).forEach(key => {
            weights[key] = weights[key] / totalWeight;
        });
        
        // Calculate distance from the middle of each range
        const highTempMid = (filterValues.highTemp[0] + filterValues.highTemp[1]) / 2;
        const lowTempMid = (filterValues.lowTemp[0] + filterValues.lowTemp[1]) / 2;
        const overallTempMid = (filterValues.overallTemp[0] + filterValues.overallTemp[1]) / 2;
        const sunlightMid = (filterValues.sunlight[0] + filterValues.sunlight[1]) / 2;
        const cloudyMid = (filterValues.cloudy[0] + filterValues.cloudy[1]) / 2;
        
        // Calculate normalized distances (0 = at midpoint, 1 = at edge of range)
        const highTempDist = Math.abs(point.highTemp - highTempMid) / (highTempRange / 2);
        const lowTempDist = Math.abs(point.lowTemp - lowTempMid) / (lowTempRange / 2);
        const overallTempDist = Math.abs(point.avgTemp - overallTempMid) / (overallTempRange / 2);
        const sunlightDist = Math.abs(point.sunlight - sunlightMid) / (sunlightRange / 2);
        const cloudyDist = Math.abs(point.cloudyDays - cloudyMid) / (cloudyRange / 2);
        
        // Convert distances to scores (1 = perfect match, 0 = at edge of range)
        const scores = {
            highTemp: 1 - highTempDist,
            lowTemp: 1 - lowTempDist,
            overallTemp: 1 - overallTempDist,
            sunlight: 1 - sunlightDist,
            cloudy: 1 - cloudyDist
        };
        
        // Calculate weighted average score
        let weightedScore = 0;
        Object.keys(weights).forEach(key => {
            weightedScore += weights[key] * scores[key];
        });
        
        return weightedScore;
    }

    function createColoredRegions(gridData) {
        // Group grid points into regions for smoother visualization
        const regions = [];
        const gridSize = 5; // Size of each grid cell in degrees
        
        // Create polygons for each grid cell
        gridData.forEach(point => {
            if (point.score <= 0) return; // Skip points with no match
            
            // Create a polygon for this grid cell
            const polygonPoints = [
                [point.lat - gridSize/2, point.lon - gridSize/2],
                [point.lat + gridSize/2, point.lon - gridSize/2],
                [point.lat + gridSize/2, point.lon + gridSize/2],
                [point.lat - gridSize/2, point.lon + gridSize/2]
            ];
            
            // Add this polygon to our regions
            regions.push({
                type: 'Feature',
                properties: {
                    score: point.score,
                    data: point
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [polygonPoints.map(p => [p[1], p[0]])] // GeoJSON uses [lon, lat]
                }
            });
        });
        
        return {
            type: 'FeatureCollection',
            features: regions
        };
    }

    function updateMap() {
        const loadingIndicator = document.getElementById('loading');
        loadingIndicator.style.display = 'block';
        
        setTimeout(() => {
            // Calculate match scores for all grid points
            const scoredData = weatherData.map(point => ({
                ...point,
                score: calculateMatchScore(point)
            }));
            
            // Create GeoJSON for the colored regions
            const regionsGeoJSON = createColoredRegions(scoredData);
            
            // Remove existing layers if they exist
            if (matchLayer) {
                map.removeLayer(matchLayer);
            }
            if (cityMarkersLayer) {
                map.removeLayer(cityMarkersLayer);
            }
            
            // Create the colored regions layer
            matchLayer = L.geoJSON(regionsGeoJSON, {
                style: function(feature) {
                    const score = feature.properties.score;
                    return {
                        fillColor: '#4CAF50', // Green color
                        weight: 0,
                        opacity: 0,
                        fillOpacity: score * 0.8 // Opacity based on match score
                    };
                }
            }).addTo(map);
            
            // Add popups to the regions
            matchLayer.eachLayer(layer => {
                const props = layer.feature.properties;
                const point = props.data;
                const matchPercentage = Math.round(props.score * 100);
                
                layer.bindPopup(
                    `<strong>Weather Data</strong><br>` +
                    `Nearest City: ${point.nearestCityName}<br>` +
                    `High Temp: ${point.highTemp}°F<br>` +
                    `Low Temp: ${point.lowTemp}°F<br>` +
                    `Avg Temp: ${point.avgTemp}°F<br>` +
                    `Sunlight: ${point.sunlight} hrs/day<br>` +
                    `Cloudy Days: ${point.cloudyDays}/month<br>` +
                    `<strong>Match Score: ${matchPercentage}%</strong>`
                );
            });
            
            // Add markers for major cities that match the criteria
            const matchingCities = cityWeatherData.filter(city => calculateMatchScore(city) > 0.5);
            
            cityMarkersLayer = L.layerGroup();
            
            matchingCities.forEach(city => {
                const score = calculateMatchScore(city);
                const matchPercentage = Math.round(score * 100);
                
                // Only show cities with good matches
                if (score > 0) {
                    const marker = L.marker([city.lat, city.lon], {
                        title: city.name
                    }).bindPopup(
                        `<strong>${city.name}</strong><br>` +
                        `High Temp: ${city.highTemp}°F<br>` +
                        `Low Temp: ${city.lowTemp}°F<br>` +
                        `Avg Temp: ${city.avgTemp}°F<br>` +
                        `Sunlight: ${city.sunlight} hrs/day<br>` +
                        `Cloudy Days: ${city.cloudyDays}/month<br>` +
                        `<strong>Match Score: ${matchPercentage}%</strong>`
                    );
                    
                    cityMarkersLayer.addLayer(marker);
                }
            });
            
            cityMarkersLayer.addTo(map);
            
            loadingIndicator.style.display = 'none';
        }, 10);
    }

    // Initialize the map
    updateFilterValues();
    updateMap();

    document.getElementById('reset-btn').addEventListener('click', () => {
        Object.keys(sliders).forEach(key => {
            sliders[key].noUiSlider.set(ranges[key]);
        });
    });
});