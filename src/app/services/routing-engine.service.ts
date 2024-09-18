import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class RoutingEngineService {
    private routingEngineUrl: string =
        'http://localhost:5000/route/v1/driving/';
    constructor() {}

    async getRoute(start: L.LatLng, end: L.LatLng): Promise<any> {
        const url = `${this.routingEngineUrl}${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&steps=true`;

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.routes && data.routes.length > 0) {
            return data.routes[0].geometry;
        } else {
            throw new Error('No route found');
        }
    }
}
