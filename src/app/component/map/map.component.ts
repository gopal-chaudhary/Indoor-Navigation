import { Component, AfterViewInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';
import { MarkLocations } from './utils/MarkLocationsn';
import { Coordinate } from '../../interfaces/mapInterface';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss', '../../../../node_modules/leaflet/dist/leaflet.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true
})
export class MapComponent implements AfterViewInit {
  constructor() { }
  private map: any;
  private markerLayer: L.LayerGroup = L.layerGroup();
  markedLocations:any = [
    { name: 'Location 1', lat: 51.505, lng: -0.09 },
    { name: 'Location 2', lat: 51.515, lng: -0.1 },
  ];
  mapsettings:any={
    Location: [23.45610, 75.42270],
    zoom:18


  }


  // sample points for the marker
  pointsTuples: [number, number][] = [
    [23.45610, 75.42270],
    [22.72299, 75.864716],
    [22.962187, 76.05011],
    [23.187076, 75.769958],
    [22.243344, 76.133881],
  ];



  private initMap(): void {
    //--------------INIT MAP------------------
    this.map = L.map('map', {
      center: this.mapsettings.Location,
      zoom: this.mapsettings.zoom,

    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tiles.addTo(this.map);
    //----------------------------------------------------------







    //-------------------------add markers------------------------------------------
    // 1.] Convert the tuples to Coordinate objects
    const points: Coordinate[] = this.pointsTuples.map(([lat, lng]) => ({ lat, lng }));
    // 2.] Call the function with the map and points
    MarkLocations(this.map, points);


    // --------------------------------------------------------------
    }
     //-------------------searchbar code------------------------------
     searchLocation(query: string): void {
      // Clear previous markers
      this.markerLayer.clearLayers();

      const location = this.markedLocations.find((loc:any) => loc.name.toLowerCase() === query.toLowerCase());
      if (location) {
        this.map.setView([location.lat, location.lng], 13);
        L.marker([location.lat, location.lng]).addTo(this.markerLayer)
          .bindPopup(location.name)
          .openPopup();
        this.markerLayer.addTo(this.map);
      } else {
        alert('Location not found');
      }
    }





  ngAfterViewInit(): void {
    this.initMap();
  }
}
