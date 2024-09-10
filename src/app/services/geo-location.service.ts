import { Injectable } from '@angular/core';
import { mapCoordinates } from '../interfaces/mapCoordinates.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GeoLocationService {
    private positionSubject = new BehaviorSubject<mapCoordinates | null>(null);

    public position$ = this.positionSubject.asObservable();

    private options: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
    };

    constructor() {
        this.initGeoLocation();
    }

    private initGeoLocation(): void {
        if (navigator.geolocation) {

            navigator.geolocation.watchPosition(
                (position: GeolocationPosition) => {
                    const coords: mapCoordinates = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    this.positionSubject.next(coords);
                    // Save to localStorage
                    localStorage.setItem(
                        'geoCoordinates',
                        JSON.stringify(coords)
                    );
                },
                (error) => {
                    console.error('Navigator Error:', error.message);
                    // If there's an error, fallback to the last known location from localStorage
                    const savedPosition =
                        localStorage.getItem('geoCoordinates');
                    if (savedPosition) {
                        this.positionSubject.next(JSON.parse(savedPosition));
                    }
                },
                this.options
            );
        } else {
            console.warn('Navigator is not supported.');
            // Fallback to the last known location from localStorage if geolocation is not supported
            const savedPosition = localStorage.getItem('geoCoordinates');
            if (savedPosition) {
                this.positionSubject.next(JSON.parse(savedPosition));
            }
        }
    }

    // Get the current position as an Observable
    getLocation(): Observable<mapCoordinates | null> {
        return this.position$;
    }
}
