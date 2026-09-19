import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';
import { LoginPageComponent } from './features/auth/login-page.component';
import { EventCreatePageComponent } from './features/events/event-create-page.component';
import { EventDetailPageComponent } from './features/events/event-detail-page.component';
import { EventsProgressPageComponent } from './features/events/events-progress-page.component';
import { TodayPageComponent } from './features/today/today-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'hoy'
  },
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'hoy',
    component: TodayPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'crear',
    component: EventCreatePageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'evento/:id',
    component: EventDetailPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'progreso',
    component: EventsProgressPageComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'hoy'
  }
];
