import * as L from 'leaflet';
import { GeoLocationService } from './geo-location.service';
import { Injectable } from '@angular/core';
import { mapCoordinates } from '../interfaces/mapCoordinates.interface';
import { MapSettings } from '../interfaces/mapSettings.interface';
import { TileLayer } from '../interfaces/tileLayer.interface';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    // Default map settings, used if no user location is available
    private defaultMapSettings: MapSettings = {
        location: [31.25271960741618, 100.70475680715587],
        zoom: 19,
    };

    private mapSettings: MapSettings = { ...this.defaultMapSettings };
    private mapLocation$!: mapCoordinates;

    private map!: L.Map;
    private userLocation!: L.Marker;

    // Tile layer settings
    private tileLayer: TileLayer = {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            minZoom: 3,
            attribution: 'OpenStreetMap',
        },
    };

    /**
     * Constructor for the MapService
     * @param geoLocationService Service to get the user's location
     * @example
     *      constructor(private mpaService: MapService) {}
     *      ngAfterViewInit(): void {
     *          let mapEl: HTMLElement = document.getElementById('map') as HTMLElement;
     *          this.mapService.getMap(mapEl).subscribe();
     *          // or
     *          this.mapService.renderGeoJson(data); // where data is a GeoJSON object
     *     }
     */
    constructor(private geoLocationService: GeoLocationService) {
        this.initializeMapSettings();
    }

    /**
     * Initialize the map settings either from GeoLocationService or localStorage
     */
    private initializeMapSettings(): void {
        // Try to retrieve last stored map settings from localStorage
        const storedSettings = localStorage.getItem('mapSettings');
        if (storedSettings) {
            this.mapSettings = JSON.parse(storedSettings);
        }

        // Subscribe to location updates
        this.geoLocationService
            .getLocation()
            .pipe(
                map((position) => {
                    if (position) {
                        this.mapLocation$ = position;
                        this.updateMapSettings(position.lat, position.lng);
                        this.saveMapSettings();
                        this.renderLocationMarker();
                    } else {
                        console.warn(
                            'No position available, using stored or default settings'
                        );
                        this.useStoredOrDefaultLocation();
                    }
                    return of(this.mapSettings);
                })
            )
            .subscribe();
    }

    /**
     * Get the map object as an observable
     * @param element The HTML element to render the map in
     * @returns {Observable<L.Map>}
     * @example
     *      let mapEl: HTMLElement = document.getElementById('map') as HTMLElement;
     *      this.mapService.getMap(mapEl).subscribe();
     *      // or
     *      this.mapService.getMap(mapEl).subscribe((map: L.Map) => {
     *          console.log('Map loaded:', map);
     *          this.map = map;
     *          // Do something with the map
     *      });
     */
    getMap(element: HTMLElement): Observable<L.Map> {
        if (!this.map) {
            this.renderMap(element);
        }
        return of(this.map);
    }

    /**
     * Render the map with the specified element and settings
     * @param element The HTML element to attach the map to
     */
    private renderMap(element: HTMLElement): void {
        this.map = L.map(element, {
            center: this.mapSettings.location,
            zoom: this.mapSettings.zoom,
        });

        L.tileLayer(this.tileLayer.url, this.tileLayer.options).addTo(this.map);

        // Add marker and pan to location
        this.renderLocationMarker();
    }

    /**
     * Renders a marker at the user's current location and pans to it.
     */
    private renderLocationMarker(): void {
        if (!this.map) {
            console.warn('Map not initialized');
            return;
        }
        const defaultIconSize: L.PointTuple = [32, 32]; // Default icon size

        // Marker icon configuration with the large size initially
        const markerOptions: L.MarkerOptions = {
            title: 'You are here',
            icon: L.icon({
                iconUrl: '/location-icon.png',
                iconSize: defaultIconSize, // Initial larger size
                iconAnchor: [16, 32], // Adjust anchor for larger size
            }),
        };

        if (!this.userLocation) {
            // First time adding the marker
            this.userLocation = L.marker(
                this.mapSettings.location,
                markerOptions
            ).addTo(this.map);
        } else {
            // Smoothly transition the marker position
            this.userLocation.setLatLng(this.mapSettings.location);
        }

        // Pan to the new location with animation
        this.map.flyTo(this.mapSettings.location, this.mapSettings.zoom, {
            animate: true,
            duration: 1.5, // Animation duration (seconds)
        });
    }

    /**
     * Update the map settings for location and zoom
     * @param lat Latitude of the location
     * @param lng Longitude of the location
     */
    private updateMapSettings(lat: number, lng: number): void {
        this.mapSettings.location = [lat, lng];
    }

    /**
     * Save the current map settings to localStorage
     */
    private saveMapSettings(): void {
        localStorage.setItem('mapSettings', JSON.stringify(this.mapSettings));
    }

    /**
     * Fallback to stored or default map location if no geolocation is available
     */
    private useStoredOrDefaultLocation(): void {
        if (!this.mapLocation$) {
            this.mapLocation$ = {
                lat: this.mapSettings.location[0],
                lng: this.mapSettings.location[1],
            };
        }
    }

    /**
     * Renders GeoJSON data on the map
     * @param data GeoJSON data to render
     * @example
     *      this.mapService.renderGeoJson(data);
     *      // where data is a GeoJSON object
     */
    renderGeoJson(data: any): void {
        L.geoJSON(data, {
            style: this.getStyles(data),
        }).addTo(this.map);
    }

    /**
     * Returns styles for GeoJSON features
     * @param feature GeoJSON feature object
     * @returns Styles for the GeoJSON layer
     */
    private getStyles(feature: any): L.PathOptions {
        const defaultStyle: L.PathOptions = {
            fillColor: '#FFFFFF',
            weight: 2,
            opacity: 1,
            color: 'black',
            dashArray: '',
            fillOpacity: 0.7,
        };

        if (feature.properties && feature.properties.style) {
            return {
                fillColor:
                    feature.properties.style.fill || defaultStyle.fillColor,
                weight: feature.properties.style.weight || defaultStyle.weight,
                color: feature.properties.style.color || defaultStyle.color,
                fillOpacity:
                    feature.properties.style.fillOpacity ||
                    defaultStyle.fillOpacity,
                dashArray:
                    feature.properties.style.dashArray ||
                    defaultStyle.dashArray,
            };
        }

        return defaultStyle;
    }
}
