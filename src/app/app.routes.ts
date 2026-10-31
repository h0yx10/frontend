import { Routes } from '@angular/router';

import { authGuard, guestGuard, organizerGuard } from './core/auth/guards/auth.guard';
import { AccountPageComponent } from './core/auth/components/account-page.component';
import { LoginPageComponent } from './core/auth/components/login-page.component';
import { ShellLayoutComponent } from './core/layout/shell-layout.component';
import { ActivitiesPageComponent } from './features/events/activities-page.component';
import { EventCreatePageComponent } from './features/events/event-create-page.component';
import { EventDetailPageComponent } from './features/events/event-detail-page.component';
import { EventsProgressPageComponent } from './features/events/events-progress-page.component';
import { TodayPageComponent } from './features/today/today-page.component';

export const routes: Routes = [
  // Cada ruta tiene su propio título de pestaña (WCAG 2.4.2): el lector de pantalla lo anuncia al navegar.
  {
    path: 'login',
    title: 'Iniciar sesión · Eventia',
    component: LoginPageComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    title: 'Crear cuenta · Eventia',
    component: LoginPageComponent,
    data: { mode: 'register' },
    canActivate: [guestGuard]
  },
  {
    // Las páginas privadas son hijas del shell: se activa junto con la página destino, sólo cuando
    // todos los guards pasaron, y nunca muestra el login dentro de la barra lateral.
    path: '',
    component: ShellLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'hoy' },
      { path: 'cuenta', title: 'Mi cuenta · Eventia', component: AccountPageComponent, canActivate: [authGuard] },
      { path: 'hoy', title: 'Hoy · Eventia', component: TodayPageComponent, canActivate: [authGuard, organizerGuard] },
      { path: 'crear', title: 'Nuevo evento · Eventia', component: EventCreatePageComponent, canActivate: [authGuard, organizerGuard] },
      { path: 'evento/:id', title: 'Detalle del evento · Eventia', component: EventDetailPageComponent, canActivate: [authGuard, organizerGuard] },
      { path: 'actividades', title: 'Actividades · Eventia', component: ActivitiesPageComponent, canActivate: [authGuard, organizerGuard] },
      { path: 'progreso', title: 'Progreso · Eventia', component: EventsProgressPageComponent, canActivate: [authGuard, organizerGuard] },
      { path: '**', redirectTo: 'hoy' }
    ]
  }
];
