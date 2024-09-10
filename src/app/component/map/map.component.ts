import { Component } from '@angular/core';
import { MapService } from '../../services/map.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    standalone: true,
})
export class MapComponent {
    private map!: L.Map;

    private osmbSettings = {
        zoom: 19,
        effects: ['shadows', 'bloom'],
    };

    private osmb!: any;

    constructor(private mapService: MapService) {}

    async ngAfterViewInit(): Promise<void> {
        console.log('MapComponent.ngAfterViewInit()');

        try {
            const mapEl: HTMLElement = document.getElementById(
                'map'
            ) as HTMLElement;
            this.mapService.getMap(mapEl).subscribe(async (map) => {
                this.map = map;
                await this.loadScript(
                    'https://cdn.osmbuildings.org/OSMBuildings-Leaflet.js'
                );
            });
        } catch (error) {
            console.error('Error loading OSMBuildings script:', error);
        }
    }

    /**
     * Utility function to dynamically load a script
     * @param src URL of the script to load
     */
    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(`Failed to load script: ${src}`);
            document.body.appendChild(script);
        });
    }

    render3D(event: MouseEvent): void {
        if (!this.osmb) {
            this.osmb = new (window as any).OSMBuildings(
                this.map,
                this.osmbSettings
            ).load(
                'https://{s}.data.osmbuildings.org/0.2/59fcc2e8/tile/{z}/{x}/{y}.json'
            );
        }
        this.toggleUI(event.target as HTMLButtonElement);
    }

    render2D(event: MouseEvent): void {
        if (this.osmb) {
            this.osmb.remove();
            this.osmb = undefined;
        }
        this.toggleUI(event.target as HTMLButtonElement);
    }

    private toggleUI(button: HTMLButtonElement): void {
        const buttons = document.querySelectorAll('button');
        buttons.forEach((btn) => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    }

    redirectTo(src: string) {
        window.location.assign(src)
    }
}
