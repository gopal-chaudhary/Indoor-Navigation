import { Routes } from '@angular/router';
import { EditMapPageComponent } from './pages/edit-map-page/edit-map-page.component';
import { PageNavigationMapComponent } from './pages/page-navigation-map/page-navigation-map.component';
export const routes: Routes = [

  {path:'map',component:PageNavigationMapComponent},
  {path:'editMap',component:EditMapPageComponent},
];
