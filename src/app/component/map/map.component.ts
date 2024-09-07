import { Component, AfterViewInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss', '../../../../node_modules/leaflet/dist/leaflet.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private markerLayer: L.LayerGroup = L.layerGroup();
  private geojson!: L.GeoJSON;
  markedLocations = [
    { name: 'Location 1', lat: 51.505, lng: -0.09 },
    { name: 'Location 2', lat: 51.515, lng: -0.1 },
  ];
  mapsettings:any = {
    Location: [31.25271960741618, 75.70475680715587],
    zoom: 18
  };

  private pointsTuples: [number, number][] = [
    [23.45610, 75.42270],
    [22.72299, 75.864716],
    [22.962187, 76.05011],
    [23.187076, 75.769958],
    [22.243344, 76.133881],
  ];

  private async initMap(): Promise<void> {
    this.map = L.map('map', {
      center: this.mapsettings.Location,
      zoom: this.mapsettings.zoom
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    // Add image overlay
    const imageUrl = "assets/light-chelm-galeria.svg";
    const imageBounds: L.LatLngBoundsLiteral = [
      [51.14725, 23.4427],
      [51.142, 23.445995],
    ];
    L.imageOverlay(imageUrl, imageBounds).addTo(this.map);

    // Fetch and add GeoJSON
      try {
        const response = await fetch("assets/data/data.geojson");
        const data = await response.json();

        // Function to dynamically get style from feature properties
        const getStyle = (feature:any) => {
          // Check if feature properties and style are defined
          if (feature.properties && feature.properties.style && feature.properties.style.fill) {
            return {
              fillColor: (feature.properties.style.fill) ? feature.properties.style.fill : 'gray',
              weight: (feature.properties.style.weight) ? feature.properties.style.weight : 1, // add weight
              opacity: 1,
              color: feature.properties.color, // add border color
              dashArray: '3', // add dash array [doted border]
              fillOpacity:(feature.properties.style.fillOpacity) ? feature.properties.style.fillOpacity : 1 // add fill opacity
            };
          } else {
            // Default style if feature doesn't have the required properties
            return {
              fillColor: '#FFFFFF', // Default fill color
              weight: 2,
              opacity: 1,
              color: 'black',
              dashArray: '',
              fillOpacity: 0.7
            };
          }
        };

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

  private onEachFeature(feature: any, layer: L.Layer) {
    layer.on({
      mouseover: this.highlightFeature.bind(this),
      mouseout: this.resetHighlight.bind(this),
      click: this.zoomToFeature.bind(this),
    });
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

  private initSearchFunctionality() {
    document.addEventListener("DOMContentLoaded", () => {
      const search = document.getElementById("search-shop")!;
      search.addEventListener("input", this.searchText.bind(this));
    });
  }

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

  private removeActiveItem() {
    const lists = document.querySelectorAll(".shops-list > li");
    lists.forEach((item: any) => {
      item.removeAttribute("style");
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }
}
