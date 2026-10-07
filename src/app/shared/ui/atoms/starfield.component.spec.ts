import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed } from '@angular/core/testing';

import { StarfieldComponent } from './starfield.component';
import { STARFIELD_RENDERER_FACTORY, StarfieldRendererFactory, StarfieldRendererHandle } from './starfield.renderer';

describe('StarfieldComponent', () => {
  let fixture: ComponentFixture<StarfieldComponent>;
  let renderer: jasmine.SpyObj<StarfieldRendererHandle>;
  let factory: jasmine.Spy<StarfieldRendererFactory>;
  let originalResize: typeof ResizeObserver;
  let resizeDisconnect: jasmine.Spy;

  beforeEach(async () => {
    renderer = jasmine.createSpyObj<StarfieldRendererHandle>('renderer', ['resize', 'setPointer', 'setRunning', 'dispose']);
    factory = jasmine.createSpy<StarfieldRendererFactory>('factory').and.resolveTo(renderer);
    originalResize = window.ResizeObserver;
    resizeDisconnect = jasmine.createSpy('resizeDisconnect');
    window.ResizeObserver = class {
      observe() {} unobserve() {} disconnect = resizeDisconnect;
    };
    await TestBed.configureTestingModule({
      imports: [StarfieldComponent],
      providers: [{ provide: STARFIELD_RENDERER_FACTORY, useValue: factory }]
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    window.ResizeObserver = originalResize;
  });

  function create() {
    fixture = TestBed.createComponent(StarfieldComponent);
    fixture.detectChanges();
  }

  it('arranca las partículas animadas y oculta el campo estático', fakeAsync(() => {
    create(); flushMicrotasks(); fixture.detectChanges();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(renderer.resize).toHaveBeenCalled();
    expect(renderer.setRunning).toHaveBeenCalledWith(true);
    expect(fixture.nativeElement.classList.contains('animated')).toBeTrue();
    flush();
  }));

  it('mantiene el campo estático si WebGL no está disponible', fakeAsync(() => {
    factory.and.rejectWith(new Error('WebGL no disponible'));
    create(); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('animated')).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.static-stars span').length).toBe(180);
    flush();
  }));

  it('aplica parallax con el puntero y pausa al ocultar la pestaña', fakeAsync(() => {
    create(); flushMicrotasks();
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: window.innerWidth, clientY: 0, pointerType: 'mouse' }));
    expect(renderer.setPointer).toHaveBeenCalledWith(1, -1);
    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(renderer.setRunning).toHaveBeenCalledWith(false);
    flush();
  }));

  it('libera la escena y los observadores al desmontar, aunque la carga termine después', fakeAsync(() => {
    let resolve!: (value: StarfieldRendererHandle) => void;
    factory.and.returnValue(new Promise<StarfieldRendererHandle>(done => resolve = done));
    create(); flushMicrotasks();
    fixture.destroy();
    resolve(renderer); flushMicrotasks();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.setRunning).not.toHaveBeenCalled();
    flush();
  }));
});
