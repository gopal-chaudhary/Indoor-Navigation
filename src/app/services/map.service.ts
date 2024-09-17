import * as L from 'leaflet';
import { Injectable } from '@angular/core';
import { GeoLocationService } from './geo-location.service';
import { MapSettings } from '../interfaces/mapSettings.interface';
import { RoutingEngineService } from './routing-engine.service';
import { TileLayer } from '../interfaces/tileLayer.interface';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private defaultMapSettings: MapSettings = {
        location: [31.25271960741618, 100.70475680715587],
        zoom: 19,
    };

    private mapSettings: MapSettings = { ...this.defaultMapSettings };
    private map!: L.Map;
    private userLocation!: L.Marker;
    private destinationMarker!: L.Marker;
    private routeLayer!: L.GeoJSON;

    private tileLayer: TileLayer = {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            minZoom: 3,
            attribution: 'OpenStreetMap',
        },
    };

    constructor(
        private geoLocationService: GeoLocationService,
        private routingEngineService: RoutingEngineService
    ) {
        this.initializeMapSettings();
    }

    private initializeMapSettings(): void {
        const storedSettings = localStorage.getItem('mapSettings');
        if (storedSettings) {
            this.mapSettings = JSON.parse(storedSettings);
        }

        this.geoLocationService
            .getLocation()
            .pipe(
                map((position) => {
                    if (position) {
                        this.mapSettings.location = [
                            position.lat,
                            position.lng,
                        ];
                        this.saveMapSettings();
                        this.renderLocationMarker();
                    } else {
                        console.warn(
                            'No position available, using stored or default settings'
                        );
                        this.useStoredOrDefaultLocation();
                    }
                    return this.mapSettings;
                })
            )
            .subscribe();
    }

    getMap(element: HTMLElement): Observable<L.Map> {
        if (!this.map) {
            this.renderMap(element);
        }

        return of(this.map);
    }

    private renderMap(element: HTMLElement): void {
        this.map = L.map(element, {
            center: this.mapSettings.location,
            zoom: this.mapSettings.zoom,
        });

        L.tileLayer(this.tileLayer.url, this.tileLayer.options).addTo(this.map);
        this.renderLocationMarker();
    }

    async renderMarker(location: L.LatLng): Promise<void> {
        if (!this.map) {
            console.warn('Map not initialized');
            return;
        }

        const markerOptions: L.MarkerOptions = {
            title: 'Destination',
            icon: L.icon({
                iconUrl: '/assets/images/location-icon.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
        };

        if (!this.destinationMarker) {
            this.destinationMarker = L.marker(location, markerOptions).addTo(
                this.map
            );
        } else {
            this.destinationMarker.setLatLng(location);
        }

        try {
            const routeGeoJson = await this.routingEngineService.getRoute(
                this.userLocation.getLatLng(),
                location
            );
            this.renderRoute(routeGeoJson);
        } catch (error) {
            console.error('Error getting route:', error);
        }
    }

    private renderLocationMarker(): void {
        if (!this.map) {
            console.warn('Map not initialized');
            return;
        }

        const markerOptions: L.MarkerOptions = {
            title: 'You are here',
            icon: L.icon({
                iconUrl: '/assets/images/location-icon.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
        };

        if (!this.userLocation) {
            this.userLocation = L.marker(
                this.mapSettings.location,
                markerOptions
            ).addTo(this.map);
        } else if (this.mapSettings.location[0] - this.userLocation.getLatLng().lat > 0.0001 || this.mapSettings.location[1] - this.userLocation.getLatLng().lng > 0.0005) {
            this.userLocation.setLatLng(this.mapSettings.location);

            this.map.flyTo(this.mapSettings.location, this.mapSettings.zoom, {
                animate: true,
                duration: 1.5,
            });
            }
    }

    private saveMapSettings(): void {
        localStorage.setItem('mapSettings', JSON.stringify(this.mapSettings));
    }

    private useStoredOrDefaultLocation(): void {
        this.mapSettings.location =
            this.mapSettings.location || this.defaultMapSettings.location;
    }

    renderRoute(data: any): void {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        this.routeLayer = this.renderGeoJson(data);
    }

    renderGeoJson(data: any): L.GeoJSON {
        return L.geoJSON(data, { style: this.getStyles(data) }).addTo(this.map);
    }

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
