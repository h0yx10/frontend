import { cameraDistance, ORBIT_FOV, ORBIT_ROTATION, ORBIT_TILT } from './orbit-scene.motion';

describe('Encuadre de las etiquetas orbitales', () => {
  for (const [width, height] of [[320, 340], [615, 400], [940, 400], [1400, 400]]) {
    it(`mantiene la etiqueta completa dentro de la escena de ${width} × ${height} durante una vuelta`, () => {
      const radius = 3.85;
      const distance = cameraDistance(width, height, radius);
      const focal = height / (2 * Math.tan(ORBIT_FOV * Math.PI / 360));
      for (let degree = 0; degree < 360; degree++) {
        const angle = degree * Math.PI / 180;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const depth = y * Math.sin(ORBIT_TILT);
        const worldY = x * Math.sin(ORBIT_ROTATION) + y * Math.cos(ORBIT_TILT) * Math.cos(ORBIT_ROTATION);
        const anchor = height / 2 - worldY * focal / (distance - depth) - 14 * distance / (distance - depth);
        // Incluye la altura máxima del chip y el pequeño crecimiento al completarse.
        expect(anchor - 34).withContext(`borde superior, ángulo ${degree}`).toBeGreaterThanOrEqual(12);
        expect(anchor).withContext(`borde inferior, ángulo ${degree}`).toBeLessThan(height - 12);
      }
    });
  }
});
