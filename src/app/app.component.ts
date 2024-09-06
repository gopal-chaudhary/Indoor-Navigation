import { Component } from '@angular/core';
import { MapComponent } from "./map/map.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'indoor-navigation';
}
