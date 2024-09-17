import * as L from 'leaflet';
import { Injectable } from '@angular/core';
import { GeoLocationService } from './geo-location.service';
import { MapSettings } from '../interfaces/mapSettings.interface';
import { RoutingEngineService } from './routing-engine.service';
import { TileLayer } from '../interfaces/tileLayer.interface';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import * as data from "../../../public/nata.json";

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private defaultMapSettings: MapSettings = {
        location: [31.25118469655742, 75.70537969633557],
        zoom: 19,
    };

    private mapSettings: MapSettings = { ...this.defaultMapSettings };
    private map!: L.Map;
    private userLocation!: L.Marker;
    private destinationMarker!: L.Marker;
    private routeLayer!: L.GeoJSON;
    private customLayer!: L.GeoJSON;

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
                        console.log('Using current position:', position);
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
        this.renderGeoJson(data, true);
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
        } else if (
            this.mapSettings.location[0] - this.userLocation.getLatLng().lat >
            0.0001 ||
            this.mapSettings.location[1] - this.userLocation.getLatLng().lng >
            0.0005
        ) {
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

    renderLayer(data: any): void {
        if (this.customLayer) {
            this.map.removeLayer(this.customLayer);
        }
        this.customLayer = this.renderGeoJson(data, true);
    }

    renderRoute(data: any): void {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }
        this.routeLayer = this.renderGeoJson(data);
    }

    renderGeoJson(data: any, isCustom: boolean = false): L.GeoJSON {
        if (!this.customLayer && isCustom) {
            this.customLayer = L.geoJSON(null, {
                pointToLayer: function (feature, latlng) {
                    let label = String(feature.properties.name);
                    return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: '#000',
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8,
                    }).bindTooltip(label, { permanent: true, opacity: 0.7 }).openTooltip();
                }
            });
            this.customLayer.addData(data);
            this.customLayer.addTo(this.map);
        } else if (isCustom) {
            this.customLayer.addData(data);
            this.customLayer.addTo(this.map);
        }
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

    async addingListItem(): Promise<{
        geojson: any;
        features: any;
        data: any;
    }> {
        let geojson: any;
        let features = [] as any;
        try {
            const response = await fetch("../../../assets/data/data1.geojson");
            const data = await response.json();

            geojson = L.geoJSON(data, {
                style: this.getStyles(data.features),
            }).addTo(this.map);

            data.features.forEach((feature: any) => {
                features.push(feature);
            })

            return { geojson, features, data };
        } catch (error) {
            console.error('Error fetching GeoJSON data:', error);
        }
        return { geojson, features, data };
    }

    /*
    async addingListItem(){
        try {
            const response = await fetch("assets/data/data1.geojson");
            const data = await response.json();

            // Creating GeoJSON layer with dynamic styling
            this.geojson = L.geoJSON(data, {
              style: getStyle,
              onEachFeature: this.onEachFeature.bind(this)
            }).addTo(this.map);

            this.populateShopsList(data);
          } catch (error) {
            console.error('Error fetching GeoJSON data:', error);
          }



        // Initialize search functionality
        this.initSearchFunctionality();
    }

  private highlightFeature(e: L.LeafletEvent) {
    const layer:any = e.target as L.Layer;
    layer.setStyle({
      weight: 2,
      color: "black",
      dashArray: 6,
    });
  }

      private resetHighlight(e: L.LeafletEvent) {
        this.geojson.resetStyle(e.target);
      }
      private zoomToFeature(e: L.LeafletEvent) {
        const layer:any = e.target as L.Layer;
        const bounds = layer.getBounds();
        this.map.flyToBounds(bounds, { padding: [50, 50] });

        const searchElement = document.getElementById("search-shop");
        if (searchElement) {
          (searchElement as HTMLInputElement).value = "";
        }

        this.removeActiveItem();
        this.setActiveMenuItem(layer.feature.properties.id);

        const { name, logo, button, description } = layer.feature.properties.info;

        ///display
        const logoImg = logo ? `<div class="info-logo"><img src="assets/${logo}"></div>` : " ";
        const descriptionText = description ? `<div class="info-description">${description}</div>` : "";
        const infoButton = button ? `<div class="info-button"><button>${button}</button></div>` : "";

        const template = `
          <div class="info-shop">
            ${logoImg}
            <div>
              <h1 class="info-name">${name}</h1>
              ${descriptionText}
              ${infoButton}
            </div>
          </div>`;

        layer.bindPopup(template).openPopup();
      }
      private removeActiveItem() {
        const lists = document.querySelectorAll(".shops-list > li");
        lists.forEach((item: any) => {
          item.removeAttribute("style");
        });
      }
      private setActiveMenuItem(id: string) {
        const lists = document.querySelectorAll(".shops-list > li");
        lists.forEach((item: any) => {
          item.classList.remove("active-shop");
        });

        const item:any = Array.from(lists).find((item: any) => item.dataset.shopId === id);
        if (item) {
          item.classList.add("active-shop");
          const ulElement:any = document.querySelector(".shops-list")!;
          ulElement.scrollTo(0, item.offsetTop - ulElement.offsetTop);
        }
      }
      private initSearchFunctionality() {
        document.addEventListener("DOMContentLoaded", () => {
          const search = document.getElementById("search-shop")!;
          search.addEventListener("input", this.searchText.bind(this));
        });
      }

///display
  private searchText() {
    const input = document.getElementById("search-shop") as HTMLInputElement;
    const filter = input.value.toUpperCase();
    const lists = document.querySelectorAll(".shops-list > li");
    const category = document.querySelectorAll(".shop-category");

    lists.forEach((list: any) => {
      const item = list.textContent || "";
      list.style.display = item.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    });

    if (filter.length >= 1) {
      category.forEach((el) => {
        (el.parentNode as any).style.display = "none";
      });
    }
  }

///display
  private async populateShopsList(data: any) {
    const shopsList = document.querySelector(".shops-list")!;
    const sortedFeatures = data.features.sort((a: any, b: any) =>
      a.properties.category.localeCompare(b.properties.category) ||
      a.properties.info.name.localeCompare(b.properties.info.name)
    );

    sortedFeatures.forEach((item: any, index: number, array: any[]) => {
      const category = item.properties.category !== array[index - 1]?.properties.category
        ? `<li><h3 class="shop-category">${item.properties.category}</h3></li>`
        : "";

      const template = `
        ${category}
        <li class="shop-item" data-shop-id="${item.properties.id}">
          <div class="name">${item.properties.info.name}</div>
          <div class="shop-color" style="background: ${item.properties.color}"></div>
        </li>
      `;

      shopsList.insertAdjacentHTML("beforeend", template);
    });

    this.initShopItemClick();
  }
///display
  private initShopItemClick() {
    const shopItems = document.querySelectorAll(".shop-item");
    shopItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const id = (e.target as any).closest(".shop-item")!.dataset.shopId;
        this.geojson.eachLayer((layer: any) => {
          if (layer.feature.properties.id == id) {
            this.zoomToFeature({ target: layer } as any);
          }
        });
      });
    });
  }



}*/
}
