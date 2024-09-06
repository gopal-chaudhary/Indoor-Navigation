## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [MouseFollower](#mousefollower)
- [MarkLocations](#marklocations)

## Overview
  future scope

## Installation

1. **Ensure you have Leaflet installed:**

   If you haven't already, install Leaflet using npm:

   ```bash
   npm install 
   ```




### MouseFollower

#### Purpose
The `MouseFollower` function creates a floating `div` element that displays the latitude and longitude coordinates of the mouse cursor's position as it moves over a Leaflet map.

#### How It Works
- **Displays Coordinates:** As the mouse moves over the map, the function updates the `div` with the current latitude and longitude based on the cursor's position.
- **Follows Mouse:** The `div` follows the cursor and adjusts its position to stay within the map container.

#### Usage

1. **Import the Function:**

   ```typescript
   import { MouseFollower } from './utils/MouseFollower'; // Adjust the path to where MouseFollower.ts is located
   ```

2. **Initialize Your Map and Call `MouseFollower`:**

   ```typescript
   import * as L from 'leaflet';
   import { MouseFollower } from './utils/MouseFollower'; // Adjust the path as needed

   // Initialize Leaflet map
   const map = L.map('map', {
     center: [51.505, -0.09],
     zoom: 13,
   });

   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     maxZoom: 18,
     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
   }).addTo(map);

   // Apply MouseFollower to the map
   MouseFollower(map);
   ```

#### Result
- **Floating Div:** A `div` will appear on the screen that follows the mouse cursor.
- **Coordinates Display:** The `div` will show the latitude and longitude of the cursor's position on the map.




### MarkLocations

#### Purpose
The `MarkLocations` function adds markers to a Leaflet map based on given coordinates and updates a sidebar with the markers that are visible within the current map view.

#### How It Works
1. **Add Markers**: Creates and places markers on the map for each coordinate provided.
2. **Update Sidebar**: Displays information about the markers that fall within the current map bounds in a sidebar.
3. **Handle Map Movements**: Updates the sidebar whenever the map is moved or zoomed.

#### Usage

1. **Import the Function**:
   ```typescript
   import { MarkLocations } from './path/to/MarkLocations'; // Adjust the path as needed
   ```

2. **Call the Function**:
   ```typescript
   // Initialize the Leaflet map
   const map = L.map('mapId'); // Replace 'mapId' with your map container ID

   // Define your coordinates
   const points = [
     { lat: 51.505, lng: -0.09 },
     // Add more coordinates as needed
   ];

   // Add markers and setup sidebar
   MarkLocations(map, points);
   ```

#### Features
- **Markers**: Adds markers to the map for each coordinate.
- **Sidebar**: Updates an element with the ID `sidebar` to list markers that are visible on the current map view.
- **Event Handling**: Reacts to map movements by refreshing the sidebar content to reflect the visible markers.

#### Notes
- Ensure you have an HTML element with the ID `sidebar` for displaying marker information.
- The function assumes you have initialized a Leaflet map instance before calling it.

