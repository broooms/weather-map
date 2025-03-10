// Original city data
const cityWeatherData = [
    { lat: 40.7128, lon: -74.0060, name: "New York", highTemp: 85, lowTemp: 65, avgTemp: 75, sunlight: 7, cloudyDays: 10 },
    { lat: 51.5074, lon: -0.1278, name: "London", highTemp: 70, lowTemp: 50, avgTemp: 60, sunlight: 5, cloudyDays: 15 },
    { lat: -33.8688, lon: 151.2093, name: "Sydney", highTemp: 82, lowTemp: 64, avgTemp: 73, sunlight: 8, cloudyDays: 8 },
    { lat: 48.8566, lon: 2.3522, name: "Paris", highTemp: 75, lowTemp: 55, avgTemp: 65, sunlight: 6, cloudyDays: 12 },
    { lat: 35.6762, lon: 139.6503, name: "Tokyo", highTemp: 80, lowTemp: 60, avgTemp: 70, sunlight: 6.5, cloudyDays: 11 },
    { lat: 19.4326, lon: -99.1332, name: "Mexico City", highTemp: 75, lowTemp: 55, avgTemp: 65, sunlight: 8, cloudyDays: 9 },
    { lat: -22.9068, lon: -43.1729, name: "Rio de Janeiro", highTemp: 88, lowTemp: 70, avgTemp: 79, sunlight: 9, cloudyDays: 7 },
    { lat: 55.7558, lon: 37.6173, name: "Moscow", highTemp: 65, lowTemp: 45, avgTemp: 55, sunlight: 4, cloudyDays: 18 },
    { lat: 37.7749, lon: -122.4194, name: "San Francisco", highTemp: 70, lowTemp: 55, avgTemp: 62.5, sunlight: 7.5, cloudyDays: 13 },
    { lat: 1.3521, lon: 103.8198, name: "Singapore", highTemp: 90, lowTemp: 75, avgTemp: 82.5, sunlight: 8, cloudyDays: 14 },
    { lat: 25.2048, lon: 55.2708, name: "Dubai", highTemp: 105, lowTemp: 80, avgTemp: 92.5, sunlight: 10, cloudyDays: 5 },
    { lat: -34.6037, lon: -58.3816, name: "Buenos Aires", highTemp: 85, lowTemp: 65, avgTemp: 75, sunlight: 8.5, cloudyDays: 9 },
    { lat: 28.5383, lon: -81.3792, name: "Orlando", highTemp: 92, lowTemp: 70, avgTemp: 81, sunlight: 9, cloudyDays: 8 },
    { lat: 59.9139, lon: 10.7522, name: "Oslo", highTemp: 68, lowTemp: 37, avgTemp: 52.5, sunlight: 4.5, cloudyDays: 16 },
    { lat: 31.2304, lon: 121.4737, name: "Shanghai", highTemp: 88, lowTemp: 65, avgTemp: 76.5, sunlight: 7, cloudyDays: 12 },
    { lat: 6.5244, lon: 3.3792, name: "Lagos", highTemp: 91, lowTemp: 73, avgTemp: 82, sunlight: 8, cloudyDays: 10 },
    { lat: 41.9028, lon: 12.4964, name: "Rome", highTemp: 86, lowTemp: 60, avgTemp: 73, sunlight: 8, cloudyDays: 9 },
    { lat: -1.2921, lon: 36.8219, name: "Nairobi", highTemp: 77, lowTemp: 55, avgTemp: 66, sunlight: 9, cloudyDays: 11 },
    { lat: 13.0827, lon: 80.2707, name: "Chennai", highTemp: 100, lowTemp: 78, avgTemp: 89, sunlight: 9.5, cloudyDays: 7 },
    { lat: -17.8252, lon: 31.0335, name: "Harare", highTemp: 82, lowTemp: 55, avgTemp: 68.5, sunlight: 9, cloudyDays: 7 }
];

// Generate a grid of points across the globe with interpolated weather data
function generateGlobalWeatherGrid() {
    // Define grid resolution
    const latStep = 5;
    const lonStep = 5;
    const gridData = [];
    
    // Generate grid points
    for (let lat = -85; lat <= 85; lat += latStep) {
        for (let lon = -180; lon <= 180; lon += lonStep) {
            // Interpolate weather data for this grid point based on known city data
            const gridPoint = interpolateWeatherData(lat, lon);
            gridData.push(gridPoint);
        }
    }
    
    return gridData;
}

// Function to interpolate weather data for a given location
function interpolateWeatherData(lat, lon) {
    // Calculate distances to all known city data points
    const distanceWeights = cityWeatherData.map(city => {
        const distance = calculateDistance(lat, lon, city.lat, city.lon);
        return {
            city,
            distance,
            weight: 1 / Math.max(distance, 0.1) // Avoid division by zero
        };
    });
    
    // Sort by distance
    distanceWeights.sort((a, b) => a.distance - b.distance);
    
    // Take the closest 5 cities or fewer if not available
    const closestCities = distanceWeights.slice(0, 5);
    const totalWeight = closestCities.reduce((sum, item) => sum + item.weight, 0);
    
    // Weighted average of each weather parameter
    const highTemp = closestCities.reduce((sum, item) => sum + item.city.highTemp * item.weight, 0) / totalWeight;
    const lowTemp = closestCities.reduce((sum, item) => sum + item.city.lowTemp * item.weight, 0) / totalWeight;
    const avgTemp = closestCities.reduce((sum, item) => sum + item.city.avgTemp * item.weight, 0) / totalWeight;
    const sunlight = closestCities.reduce((sum, item) => sum + item.city.sunlight * item.weight, 0) / totalWeight;
    const cloudyDays = closestCities.reduce((sum, item) => sum + item.city.cloudyDays * item.weight, 0) / totalWeight;
    
    // Find the nearest named city
    const nearestCity = distanceWeights[0].city;
    
    return {
        lat,
        lon,
        nearestCityName: nearestCity.name,
        distanceToCity: distanceWeights[0].distance,
        highTemp: Math.round(highTemp),
        lowTemp: Math.round(lowTemp),
        avgTemp: Math.round(avgTemp),
        sunlight: Math.round(sunlight * 10) / 10, // Round to 1 decimal place
        cloudyDays: Math.round(cloudyDays)
    };
}

// Calculate distance between two points on Earth (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Generate the global weather grid
const weatherData = generateGlobalWeatherGrid();