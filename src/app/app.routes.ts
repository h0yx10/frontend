import { Routes } from '@angular/router';

import { authGuard, guestGuard, organizerGuard } from './core/auth/guards/auth.guard';
import { AccountPageComponent } from './core/auth/components/account-page.component';
import { LoginPageComponent } from './core/auth/components/login-page.component';
import { ActivitiesPageComponent } from './features/events/activities-page.component';
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
    path: 'register',
    component: LoginPageComponent,
    data: { mode: 'register' },
    canActivate: [guestGuard]
  },
  {
    path: 'cuenta',
    component: AccountPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'hoy',
    component: TodayPageComponent,
    canActivate: [authGuard, organizerGuard]
  },
  {
    path: 'crear',
    component: EventCreatePageComponent,
    canActivate: [authGuard, organizerGuard]
  },
  {
    path: 'evento/:id',
    component: EventDetailPageComponent,
    canActivate: [authGuard, organizerGuard]
  },
  {
    path: 'actividades',
    component: ActivitiesPageComponent,
    canActivate: [authGuard, organizerGuard]
  },
  {
    path: 'progreso',
    component: EventsProgressPageComponent,
    canActivate: [authGuard, organizerGuard]
  },
  {
    path: '**',
    redirectTo: 'hoy'
  }
];
