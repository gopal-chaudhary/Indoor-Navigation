import { Injectable } from '@angular/core';
import * as L from 'leaflet';
@Injectable({
    providedIn: 'root',
})
export class RoutingEngineService {
    private routingEngineUrl: string =
        'http://router.project-osrm.org/route/v1/driving/';
    constructor() {}

    async getRoute(start: L.LatLng, end: L.LatLng): Promise<any> {
        const url = `${this.routingEngineUrl}${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.routes && data.routes.length > 0) {
            return data.routes[0].geometry;
        } else {
            throw new Error('No route found');
        }
    }
}
