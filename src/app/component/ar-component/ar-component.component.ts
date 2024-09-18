import { Component } from '@angular/core';
import { GeoLocationService } from '../../services/geo-location.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgIf } from '@angular/common';

declare const AFRAME: any;

@Component({
    selector: 'app-ar-component',
    standalone: true,
    imports: [NgIf],
    templateUrl: './ar-component.component.html',
    styleUrl: './ar-component.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArComponentComponent {
    lng: number = 0;
    lat: number = 0;
    scriptsLoaded: boolean = false;

    constructor(private location: GeoLocationService) {
        this.location.getLocation().subscribe((coordinates) => {
            if (coordinates) {
                this.lat = coordinates.lat;
                this.lng = coordinates.lng;
                console.log(
                    `Coordinates set: lat=${this.lat}, lng=${this.lng}`
                );
            }
        });
    }

    async ngOnInit() {
        await this.loadScripts();
    }

    ngAfterViewInit() {
        this.spinLock();
    }

    async spinLock() {
        if(!document.querySelector('a-scene')) {
            setTimeout(async () => {
                await this.spinLock();
            }, 1000);
        }
        else {
            console.log(document.querySelector('a-scene'));
            await this.loadData();
        }
    }

    async loadScripts() {
        const aframeScript = document.createElement('script');
        aframeScript.src = 'https://aframe.io/releases/1.2.0/aframe.min.js';
        aframeScript.onload = () => {
            const arjsScript = document.createElement('script');
            arjsScript.src =
                'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
            arjsScript.onload = () => {
                this.scriptsLoaded = true;
                console.log('AR.js script loaded');
                this.gpsSmoothening();
            };
            document.head.appendChild(arjsScript);
        };
        document.head.appendChild(aframeScript);
    }

    gpsSmoothening() {
        AFRAME.registerComponent('smooth-gps-camera', {
            schema: {
                simulateLatitude: { type: 'number', default: 0 },
                simulateLongitude: { type: 'number', default: 0 },
                minDistance: { type: 'number', default: 50 },
                maxDistance: { type: 'number', default: 2500 },
            },

            init: function () {
                this.latHistory = [];
                this.lngHistory = [];
                this.smoothingWindow = 55; // Keep the last 5 values
            },

            tick: function () {
                let currentLat = this.data.simulateLatitude;
                let currentLng = this.data.simulateLongitude;

                // Add the current coordinates to history
                this.latHistory.push(currentLat);
                this.lngHistory.push(currentLng);

                // Keep only the last 5 values
                if (this.latHistory.length > this.smoothingWindow) {
                    this.latHistory.shift();
                    this.lngHistory.shift();
                }

                // Calculate the average position
                let avgLat =
                    this.latHistory.reduce(
                        (sum: number, val: number) => sum + val,
                        0
                    ) / this.latHistory.length;
                let avgLng =
                    this.lngHistory.reduce(
                        (sum: number, val: number) => sum + val,
                        0
                    ) / this.lngHistory.length;

                // Apply the average coordinates to the GPS camera
                this.el.setAttribute('gps-camera', {
                    simulateLatitude: avgLat,
                    simulateLongitude: avgLng,
                });
            },
        });
    }

    async loadData() {
        let res = await fetch("../../../../assets/data/data1.geojson");
        let data = await res.json();
        data.features.forEach((feature: any) => {
            if(feature.geometry && feature.geometry.type == "Point") {
                const entity = document.createElement('a-box');
                entity.setAttribute('gps-entity-place', `
                    latitude: ${feature.geometry.coordinates[1]};
                    longitude: ${feature.geometry.coordinates[0]};
                `);
                entity.setAttribute('color', 'red');
                // entity.setAttribute("name", feature.properties.name as string);
                entity.setAttribute('scale', '1500 1500 1500');
                console.log(entity);
                document.querySelector('a-scene')?.appendChild(entity);
            } else if(feature.geometry && feature.geometry.type == "Polygon") {
                const entity = document.createElement('a-entity');
                const box = document.createElement('a-box');
                const text = document.createElement('a-text');
                entity.setAttribute('gps-entity-place', `
                    latitude: ${feature.geometry.coordinates[0][0][1]};
                    longitude: ${feature.geometry.coordinates[0][0][0]};
                `);
                box.setAttribute('scale', '10 10 10');
                box.setAttribute('color', 'green');
                box.setAttribute('opacity', '0.5');
                box.setAttribute("position", "0 -20 0");
                text.setAttribute('value', feature.properties.info.name as string);
                text.setAttribute('color', 'black');
                text.setAttribute('align', 'center');
                text.setAttribute('position', '0 0 0');
                text.setAttribute('scale', '30 30 30');
                entity.appendChild(box);
                entity.appendChild(text);
                document.querySelector('a-scene')?.appendChild(entity);
            }
        });
    }
}
