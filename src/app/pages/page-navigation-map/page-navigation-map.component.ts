import { Component } from '@angular/core';
import { MapComponent } from '../../component/map/map.component';

@Component({
  selector: 'app-page-navigation-map',
  standalone: true,
  imports: [MapComponent],
  templateUrl: './page-navigation-map.component.html',
  styleUrl: './page-navigation-map.component.scss'
})
export class PageNavigationMapComponent {

}
