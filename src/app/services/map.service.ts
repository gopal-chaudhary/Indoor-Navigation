import * as L from 'leaflet';
import { Injectable } from '@angular/core';
import { GeoLocationService } from './geo-location.service';
import { MapSettings } from '../interfaces/mapSettings.interface';
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

    private tileLayer: TileLayer = {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            minZoom: 3,
            attribution: 'OpenStreetMap',
        },
    };

    constructor(private geoLocationService: GeoLocationService) {
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

        fetch('./n.geojeson')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                console.log(data);
                // this.renderGeoJson(data); // Call renderGeoJson with the actual data
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
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
        } else {
            this.userLocation.setLatLng(this.mapSettings.location);
        }

        this.map.flyTo(this.mapSettings.location, this.mapSettings.zoom, {
            animate: true,
            duration: 1.5,
        });
    }

    private saveMapSettings(): void {
        localStorage.setItem('mapSettings', JSON.stringify(this.mapSettings));
    }

    private useStoredOrDefaultLocation(): void {
        this.mapSettings.location =
            this.mapSettings.location || this.defaultMapSettings.location;
    }

    renderGeoJson(data: any): void {
        L.geoJSON(data, { style: this.getStyles(data) }).addTo(this.map);
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
