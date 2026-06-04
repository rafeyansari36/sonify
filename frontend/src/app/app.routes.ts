import { Routes } from '@angular/router';
import { Upload } from './features/upload/upload';
import { Mapper } from './features/mapper/mapper';
import { Player } from './features/player/player';
import { Library } from './features/library/library';

export const routes: Routes = [
  { path: '', component: Upload },
  { path: 'map', component: Mapper },
  { path: 'play', component: Player },
  { path: 'library', component: Library },
  { path: '**', redirectTo: '' }
];
