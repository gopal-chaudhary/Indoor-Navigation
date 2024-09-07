import { Component, AfterViewInit } from '@angular/core';
import { MapService } from '../../services/map.service';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: [
        './map.component.scss',
        '../../../../node_modules/leaflet/dist/leaflet.css',
    ],
    standalone: true,
})
export class MapComponent {
    constructor(
        private mapService: MapService
    ) {}

    ngAfterViewInit(): void {
        let mapEl: HTMLElement = document.getElementById('map') as HTMLElement;
        this.mapService.getMap(mapEl).subscribe();
    }
}
