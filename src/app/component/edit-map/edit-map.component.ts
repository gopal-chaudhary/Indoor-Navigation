import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import Notiflix from 'notiflix';

@Component({
  selector: 'app-edit-map',
  templateUrl: './edit-map.component.html',
  styleUrls: [
    './edit-map.component.scss',
    '../../../../node_modules/leaflet-draw/dist/leaflet.draw.css'
  ],
  standalone: true
})
export class EditMapComponent implements AfterViewInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  private map!: L.Map;
  private drawnItems: L.FeatureGroup = L.featureGroup();

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    const config = {
      minZoom: 5,
      maxZoom: 18,
      fullscreenControl: true
    };
    const zoom = 18;
    const lat = 52.22977;
    const lng = 21.01178;

    this.map = L.map(this.mapElement.nativeElement, config).setView([lat, lng], zoom);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Initialize Notiflix
    Notiflix.Notify.init({
      width: "280px",
      position: "right-bottom",
      distance: "10px",
    });

    // Add custom control buttons
    const customControl = L.Control.extend({
      options: {
        position: "topright",
      },
      onAdd: () => {
        const array = [
          {
            title: "Export features geojson",
            html: "<svg class='icon-geojson'><use xlink:href='#icon-export'></use></svg>",
            className: "export link-button leaflet-bar",
          },
          {
            title: "Save geojson",
            html: "<svg class='icon-geojson'><use xlink:href='#icon-add'></use></svg>",
            className: "save link-button leaflet-bar",
          },
          {
            title: "Remove geojson",
            html: "<svg class='icon-geojson'><use xlink:href='#icon-remove'></use></svg>",
            className: "remove link-button leaflet-bar",
          },
          {
            title: "Load geojson from file",
            html: "<input type='file' id='geojson' class='geojson' accept='text/plain, text/json, .geojson' onchange='openFile(event)' /><label for='geojson'><svg class='icon-geojson'><use xlink:href='#icon-import'></use></svg></label>",
            className: "load link-button leaflet-bar",
          },
        ];

        const container = L.DomUtil.create("div", "leaflet-control leaflet-action-button");

        array.forEach(item => {
          const button = L.DomUtil.create("a");
          button.href = "javascript:void(0)";
          button.setAttribute("role", "button");

          button.title = item.title;
          button.innerHTML = item.html;
          button.className += item.className;

          container.appendChild(button);
        });

        return container;
      }
    });

    this.map.addControl(new customControl());

    // Add Leaflet Draw controls
    this.map.addControl(new L.Control.Draw({
      edit: {
        featureGroup: this.drawnItems,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
      },
    }));

    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      let layer = event.layer;
      let feature = (layer.feature = layer.feature || {});
      let type = event.layerType;

      feature.type = feature.type || "Feature";
      let props = (feature.properties = feature.properties || {});

      props.type = type;

      if (type === "circle") {
        props.radius = layer.getRadius();
      }

      this.drawnItems.addLayer(layer);
    });

    this.setupControlButtonEvents();
  }

  private setupControlButtonEvents(): void {
    const exportButton = document.querySelector(".export");
    const saveButton = document.querySelector(".save");
    const removeButton = document.querySelector(".remove");

    exportButton?.addEventListener("click", (e) => {
      e.preventDefault();
      const data: any = this.drawnItems.toGeoJSON();

      if (data.features.length === 0) {
        Notiflix.Notify.failure("You must have some data to save a geojson file");
        return;
      }

      Notiflix.Notify.info("You can save the data to a geojson");

      const convertedData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
      (exportButton as HTMLAnchorElement).href = "data:" + convertedData;
      (exportButton as HTMLAnchorElement).download = "data.geojson";
    });

    saveButton?.addEventListener("click", (e) => {
      e.preventDefault();
      const data: any = this.drawnItems.toGeoJSON();

      if (data.features.length === 0) {
        Notiflix.Notify.failure("You must have some data to save it");
        return;
      }

      Notiflix.Notify.success("The data has been saved to localstorage");
      localStorage.setItem("geojson", JSON.stringify(data));
    });

    removeButton?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("geojson");

      Notiflix.Notify.info("All layers have been deleted");

      this.drawnItems.eachLayer((layer) => {
        this.drawnItems.removeLayer(layer);
      });
    });

    const geojsonFromLocalStorage = JSON.parse(localStorage.getItem("geojson") || "null");

    if (geojsonFromLocalStorage) {
      this.setGeojsonToMap(geojsonFromLocalStorage);
    }
  }

  private setGeojsonToMap(geojson: any): void {
    const feature = L.geoJSON(geojson, {
      style: () => ({ color: "red", weight: 2 }),
      pointToLayer: (feature, latlng) => {
        if (feature.properties.type === "circle") {
          return new L.Circle(latlng, { radius: feature.properties.radius });
        } else if (feature.properties.type === "circlemarker") {
          return new L.CircleMarker(latlng, { radius: 10 });
        } else {
          return new L.Marker(latlng);
        }
      },
      onEachFeature: (feature: any, layer) => {
        this.drawnItems.addLayer(layer);
        const coordinates = feature.geometry.coordinates.toString();
        const result = coordinates.match(/[^,]+,[^,]+/g);

        layer.bindPopup(`<span>Coordinates:<br>${result.join("<br>")}</span>`);
      }
    }).addTo(this.map);

    this.map.flyToBounds(feature.getBounds());
  }
}
