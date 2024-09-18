import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RailwayLoaderComponent } from './component/loader/loader.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RailwayLoaderComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'indoor-navigation';
}
