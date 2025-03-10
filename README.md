# Weather Map - Find Your Ideal Travel Destination

An interactive global weather map that helps you find travel destinations based on your preferred weather parameters.

## Features

- **Interactive Weather Filters**: Adjust sliders for temperature, sunlight, and cloudy days to find your ideal climate
- **Visual Map**: Areas that match your criteria are highlighted in green, with opacity indicating match quality
- **City Markers**: Major cities that match your criteria are displayed as markers
- **Detailed Information**: Click on any region or city to see detailed weather information and match score

## How to Use

1. Adjust the sliders to set your preferred weather parameters:
   - Average High Temperature (°F)
   - Average Low Temperature (°F)
   - Average Overall Temperature (°F)
   - Sunlight (hours/day)
   - Cloudy Days (per month)

2. The map will update in real-time to show which areas match your criteria:
   - Darker green areas = better matches
   - Lighter green areas = acceptable matches
   - Transparent areas = no match

3. Click on any colored region or city marker to see detailed weather information and a match percentage.

4. Use the "Reset Filters" button to return all sliders to their default positions.

## Technologies Used

- Leaflet.js for interactive mapping
- noUiSlider for range sliders
- Vanilla JavaScript for data processing and visualization

## Live Demo

You can try the Weather Map here: [https://broooms.github.io/weather-map/](https://broooms.github.io/weather-map/)

## Development

To run this project locally:

1. Clone the repository
2. Open `index.html` in your browser

No build process or dependencies to install - it's all client-side JavaScript!

## License

MIT License