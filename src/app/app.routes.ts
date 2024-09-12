import { Routes } from '@angular/router';
import { MapComponent } from './component/map/map.component';
import { ArComponentComponent } from './component/ar-component/ar-component.component';

export const routes: Routes = [
    { path: '', component: MapComponent},
    { path: 'edit', component: ArComponentComponent },
];
