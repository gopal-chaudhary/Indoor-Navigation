import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { MapService } from '../../services/map.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements AfterViewInit {
    private map!: L.Map;
    private osmbSettings = {
        zoom: 19,
        effects: ['shadows', 'bloom'],
    };
    private osmb?: any;

    constructor(private mapService: MapService) {}

    async ngAfterViewInit(): Promise<void> {
        console.log('MapComponent.ngAfterViewInit()');
        try {
            const mapEl = document.getElementById('map') as HTMLElement;
            if (!mapEl) {
                throw new Error('Map element not found');
            }

            this.mapService.getMap(mapEl).subscribe(async (map) => {
                this.map = map;
                try {
                    await this.loadScript(
                        'https://cdn.osmbuildings.org/OSMBuildings-Leaflet.js'
                    );
                    const { features, geojson, data } =
                        await this.mapService.addingListItem();
                    this.onEachFeature(features, geojson);
                    this.populateShopsList(data);
                    this.initShopItemClick(geojson);
                    this.initSearchFunctionality();

                    mapEl.addEventListener('click', (event) => {
                        // this.renderMarker(event);
                    });
                } catch (scriptError) {
                    console.error(
                        'Error loading OSMBuildings script:',
                        scriptError
                    );
                }
            });
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    async renderMarker(event: MouseEvent): Promise<void> {
        if (!this.map) return;
        const latlng = this.map.mouseEventToLatLng(event);
        await this.mapService.renderMarker(latlng);
    }

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
        document
            .querySelectorAll('button')
            .forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
    }

    redirectTo(src: string): void {
        window.location.assign(src);
    }

    private onEachFeature(feature: any, layer: any): void {
        layer.on({
            mouseover: this.highlightFeature.bind(this),
            mouseout: (e: L.LeafletEvent) => layer.resetStyle(e.target),
            click: (e: L.LeafletEvent) => this.zoomToFeature(e as any),
        });
    }

    private highlightFeature(e: L.LeafletEvent): void {
        const layer: any = e.target as L.Layer;
        layer.setStyle({
            weight: 2,
            color: 'black',
            dashArray: '6',
        });
    }

    private zoomToFeature(e: L.LeafletEvent): void {
        let layer: any = e.target;
        if(e.propagatedFrom.feature) {
            layer = e.propagatedFrom;
        }
        const bounds: any = layer.getBounds();
        console.log('zoomToFeature', layer.feature.properties.id);
        this.map.flyToBounds(bounds, { padding: [50, 50] });

        const searchElement = document.getElementById('search-shop');
        if (searchElement) {
            (searchElement as HTMLInputElement).value = '';
        }

        this.removeActiveItem();
        this.setActiveMenuItem(layer.feature.properties.id);
        this.removeActiveItem();
        this.setActiveMenuItem(layer.feature.properties.id);

        const { name, logo, button, description } =
            layer.feature.properties.info;

        // Display
        const logoImg = logo
            ? `<div class="info-logo"><img src="assets/${logo}"></div>`
            : '';
        const descriptionText = description
            ? `<div class="info-description">${description}</div>`
            : '';
        const infoButton = button
            ? `<div class="info-button"><button>${button}</button></div>`
            : '';

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

    private removeActiveItem(): void {
        document
            .querySelectorAll('.shops-list > li')
            .forEach((item) => item.removeAttribute('style'));
    }

    private setActiveMenuItem(id: string): void {
        document.querySelectorAll('.shops-list > li').forEach((item: any) => {
            item.classList.remove('active-shop');
            if (item.dataset.shopId === id) {
                item.classList.add('active-shop');
                const ulElement: any = document.querySelector('.shops-list')!;
                ulElement.scrollTo(0, item.offsetTop - ulElement.offsetTop);
            }
        });
    }

    private initSearchFunctionality(): void {
        const searchElement = document.getElementById(
            'search-shop'
        ) as HTMLInputElement;
        if (searchElement) {
            searchElement.addEventListener('input', this.searchText.bind(this));
        }
    }

    private searchText(): void {
        const input = document.getElementById(
            'search-shop'
        ) as HTMLInputElement;
        const filter = input.value.toUpperCase();
        const lists = document.querySelectorAll('.shops-list > li');
        const categories = document.querySelectorAll('.shop-category');
        // manage shop list
        (document.querySelector('.shops-list') as HTMLElement).style.display = (filter.length > 0) ? 'block' : 'none';


        lists.forEach((list: any) => {
            const item = list.textContent || '';
            list.style.display = item.toUpperCase().includes(filter)
                ? ''
                : 'none';
        });

        if (filter.length >= 1) {
            categories.forEach(
                (el) => ((el.parentNode as HTMLElement).style.display = 'none')
            );
        }
    }

    private async populateShopsList(data: any): Promise<void> {
        const shopsList = document.querySelector('.shops-list')!;
        const sortedFeatures = data.features.sort(
            (a: any, b: any) =>
                a.properties.category.localeCompare(b.properties.category) ||
                a.properties.info.name.localeCompare(b.properties.info.name)
        );

        sortedFeatures.forEach((item: any, index: number, array: any[]) => {
            const category =
                item.properties.category !==
                array[index - 1]?.properties.category
                    ? `<li><h3 class="shop-category">${item.properties.category}</h3></li>`
                    : '';

            const template = `
        ${category}
        <li class="shop-item" data-shop-id="${item.properties.id}">
          <div class="name">${item.properties.info.name}</div>
          <div class="shop-color" style="background: ${item.properties.color}"></div>
        </li>
      `;

            shopsList.insertAdjacentHTML('beforeend', template);
        });
    }

    private initShopItemClick(geojson: L.GeoJSON): void {
        document.querySelectorAll('.shop-item').forEach((item: any) => {
            item.addEventListener('click', (e: Event) => {
                const id = (e.target as any).closest('.shop-item')!.dataset
                    .shopId;
                geojson.eachLayer((layer: any) => {
                    if (layer.feature.properties.id == id) {
                        this.zoomToFeature({ target: layer } as any);
                    }
                });
        (document.querySelector('.shops-list') as HTMLElement).style.display = 'none';

            });
        });
    }
}
