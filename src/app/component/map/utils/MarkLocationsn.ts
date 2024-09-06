import { featureGroup, marker, Marker, Map } from 'leaflet';
import { Coordinate } from '../../../interfaces/mapInterface';

// example
// const points = [
//   [23.45610, 75.42270],
//   [22.72299, 75.864716],
//   [22.962187, 76.05011],
//   [23.187076, 75.769958],
//   [22.243344, 76.133881],
// ];
// Define the Coordinate interface

// Define the function to mark locations
export function MarkLocations(map: Map, points: Coordinate[]): void {

  // Create a feature group to hold all markers
  const fg = featureGroup().addTo(map);

  // Add markers for each point
  points.forEach((point) => {
    const newMarker = marker([point.lat, point.lng]).addTo(fg);
    const getLatLong = newMarker.getLatLng();
    newMarker.bindPopup(getLatLong.toString());
  });

  // List markers based on current map bounds
  function listMarkers(): void {
    const sidebar = document.getElementById('sidebar'); // Ensure you have an element with id 'sidebar'
    if (!sidebar) return;

    sidebar.innerHTML = '';

    map.eachLayer((layer) => {
      if (layer instanceof Marker) {
        if (map.getBounds().contains(layer.getLatLng())) {
          createSidebarElements(layer);
        }
      }
    });
  }

  // Create elements for markers in bounds
  function createSidebarElements(layer: Marker): void {
    const sidebar = document.getElementById('sidebar'); // Ensure you have an element with id 'sidebar'
    if (sidebar) {
      const markerInfo = document.createElement('div');
      markerInfo.innerText = `Marker at: ${layer.getLatLng().toString()}`;
      sidebar.appendChild(markerInfo);
    }
  }

  // Event fired when user stops dragging the map
  map.on('moveend', () => {
    const sidebar = document.getElementById('sidebar'); // Ensure you have an element with id 'sidebar'
    if (sidebar) {
      sidebar.innerHTML = '';
      listMarkers();
    }
  });

  // Initial call to list markers
  listMarkers();
}
