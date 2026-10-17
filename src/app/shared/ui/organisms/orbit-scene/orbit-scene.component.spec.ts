import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed } from '@angular/core/testing';

import { OrbitSceneComponent } from './orbit-scene.component';
import { OrbitPhase } from './orbit-scene.model';
import { ORBIT_RENDERER_FACTORY, OrbitRendererFactory, OrbitRendererHandle } from './orbit-scene.renderer';

const phases: readonly OrbitPhase[] = [{id:'plan',tone:'plan',radius:1.85,speed:0.3,items:[{id:'date',label:'Fecha'}]}];

describe('OrbitSceneComponent', () => {
  let fixture: ComponentFixture<OrbitSceneComponent>;
  let renderer: jasmine.SpyObj<OrbitRendererHandle>;
  let factory: jasmine.Spy<OrbitRendererFactory>;
  let media: MediaQueryList;
  let intersection: IntersectionObserverCallback;
  let resizeDisconnect: jasmine.Spy;
  let intersectionDisconnect: jasmine.Spy;
  let animationFrames: Map<number, FrameRequestCallback>;
  let frameId: number;
  let originalResize: typeof ResizeObserver;
  let originalIntersection: typeof IntersectionObserver;

  beforeEach(async () => {
    animationFrames = new Map();
    frameId = 0;
    spyOn(window, 'requestAnimationFrame').and.callFake(callback => { animationFrames.set(++frameId, callback); return frameId; });
    spyOn(window, 'cancelAnimationFrame').and.callFake(id => { animationFrames.delete(id); });
    renderer = jasmine.createSpyObj<OrbitRendererHandle>('renderer',['resize','setRunning','dispose']);
    factory = jasmine.createSpy<OrbitRendererFactory>('factory').and.resolveTo(renderer);
    media = {
      matches:false,
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      addEventListener: jasmine.createSpy('addMotionListener'),
      removeEventListener: jasmine.createSpy('removeMotionListener')
    } as unknown as MediaQueryList;
    spyOn(window,'matchMedia').and.returnValue(media);
    originalResize = window.ResizeObserver;
    originalIntersection = window.IntersectionObserver;
    resizeDisconnect = jasmine.createSpy('resizeDisconnect');
    intersectionDisconnect = jasmine.createSpy('intersectionDisconnect');
    window.ResizeObserver = class {
      observe() {} unobserve() {} disconnect = resizeDisconnect;
    };
    window.IntersectionObserver = class {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      constructor(callback: IntersectionObserverCallback) { intersection = callback; }
      observe() {} unobserve() {} takeRecords() { return []; }
      disconnect = intersectionDisconnect;
    };
    await TestBed.configureTestingModule({imports:[OrbitSceneComponent],providers:[{provide:ORBIT_RENDERER_FACTORY,useValue:factory}]}).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    window.ResizeObserver = originalResize;
    window.IntersectionObserver = originalIntersection;
  });

  function advanceFrame(time: number) {
    const callbacks = [...animationFrames.values()];
    animationFrames.clear();
    callbacks.forEach(callback => callback(time));
  }

  function create() {
    fixture = TestBed.createComponent(OrbitSceneComponent);
    fixture.componentRef.setInput('phases',phases);
    fixture.detectChanges();
  }

  it('carga la escena diferida y permite pausar y reanudar', fakeAsync(() => {
    create();
    expect(factory).not.toHaveBeenCalled();
    flushMicrotasks();
    fixture.detectChanges();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(renderer.setRunning).toHaveBeenCalledWith(true);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();
    expect(renderer.setRunning).toHaveBeenCalledWith(false);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toContain('Reanudar');
    button.click();
    expect(renderer.setRunning).toHaveBeenCalledWith(true);
    flush();
  }));

  it('proyecta etiquetas con transformaciones y actualiza el progreso visual', fakeAsync(() => {
    factory.and.callFake(async (_canvas, _phases, _palette, onFrame) => {
      onFrame({items:[{x:230,y:150,scale:1,opacity:1,zIndex:80,done:true}],progress:100});
      return renderer;
    });
    create(); flushMicrotasks(); fixture.detectChanges();
    const chip: HTMLElement = fixture.nativeElement.querySelector('.chip');
    expect(chip.style.left).toBe('0px');
    expect(chip.style.transform).toContain('translate3d');
    expect(chip.style.transform).toContain('230px');
    expect(chip.classList.contains('done')).toBeTrue();
    expect(fixture.nativeElement.querySelector('.sun-label').textContent).toContain('Todo listo');
    flush();
  }));

  it('detiene el renderizado cuando la ilustración sale de la pantalla', fakeAsync(() => {
    create(); flushMicrotasks();
    intersection([{isIntersecting:false} as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(renderer.setRunning).toHaveBeenCalledWith(false);
    intersection([{isIntersecting:true} as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(renderer.setRunning).toHaveBeenCalledWith(true);
    flush();
  }));

  it('suspende el renderizado cuando se oculta la pestaña', fakeAsync(() => {
    create(); flushMicrotasks();
    spyOnProperty(document,'visibilityState','get').and.returnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(renderer.setRunning).toHaveBeenCalledWith(false);
    flush();
  }));

  it('arranca la animación sin interacción aunque el sistema prefiera movimiento reducido', fakeAsync(() => {
    Object.defineProperty(media,'matches',{value:true,configurable:true});
    create(); flushMicrotasks(); fixture.detectChanges();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(renderer.setRunning).toHaveBeenCalledWith(true);
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Pausar');
    flush();
  }));

  it('anima el SVG y el progreso si WebGL falla', fakeAsync(() => {
    factory.and.rejectWith(new Error('WebGL no disponible'));
    create(); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.componentInstance.fallback()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.fallback-art').classList.contains('invisible')).toBeFalse();
    expect(fixture.nativeElement.querySelector('button').disabled).toBeFalse();
    const chip: HTMLElement = fixture.nativeElement.querySelector('.chip');
    const initial = chip.style.transform;
    for (let time = 0; time <= 3000; time += 50) advanceFrame(time);
    fixture.detectChanges();
    expect(chip.style.transform).not.toBe(initial);
    expect(fixture.componentInstance.progress()).toBe(100);
    fixture.nativeElement.querySelector('button').click();
    expect(animationFrames.size).toBe(0);
    fixture.nativeElement.querySelector('button').click();
    expect(animationFrames.size).toBe(1);
    intersection([{isIntersecting:false} as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(animationFrames.size).toBe(0);
    intersection([{isIntersecting:true} as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(animationFrames.size).toBe(1);
    fixture.destroy();
    expect(animationFrames.size).toBe(0);
    flush();
  }));

  it('continúa animando con SVG si pierde el contexto WebGL', fakeAsync(() => {
    create(); flushMicrotasks();
    fixture.nativeElement.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
    expect(renderer.dispose).toHaveBeenCalled();
    expect(fixture.componentInstance.fallback()).toBeTrue();
    expect(animationFrames.size).toBe(1);
    flush();
  }));

  it('libera recursos y observadores al desmontar', fakeAsync(() => {
    create(); flushMicrotasks();
    fixture.destroy();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(resizeDisconnect).toHaveBeenCalled();
    expect(intersectionDisconnect).toHaveBeenCalled();
    flush();
  }));

  it('libera una escena cuya carga termina después de abandonar la pantalla', fakeAsync(() => {
    let resolve!: (value: OrbitRendererHandle) => void;
    factory.and.returnValue(new Promise<OrbitRendererHandle>(done => resolve = done));
    create(); flushMicrotasks();
    fixture.destroy();
    resolve(renderer); flushMicrotasks();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.setRunning).not.toHaveBeenCalled();
    flush();
  }));
});
