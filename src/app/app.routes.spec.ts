import { Route } from '@angular/router';

import { routes } from './app.routes';

/** Cada pantalla anuncia su propio título de pestaña (WCAG 2.4.2). */
describe('Títulos de las rutas', () => {
  const withComponent = (list: Route[]): Route[] =>
    list.flatMap((route) => [...(route.component && route.path !== '' ? [route] : []), ...withComponent(route.children ?? [])]);

  it('toda pantalla tiene un título distinto que termina en "· Eventia"', () => {
    const pages = withComponent(routes);
    const titles = pages.map((route) => route.title as string);

    expect(pages.map((route) => route.path)).toEqual(
      jasmine.arrayContaining(['hoy', 'crear', 'evento/:id', 'progreso'])
    );
    titles.forEach((title) => expect(title).toMatch(/^.+ · Eventia$/));
    expect(new Set(titles).size).toBe(titles.length);
  });
});
