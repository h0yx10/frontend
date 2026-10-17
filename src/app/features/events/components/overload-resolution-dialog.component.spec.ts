import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverloadResolutionDialogComponent } from './overload-resolution-dialog.component';

describe('OverloadResolutionDialogComponent: resolver una sobrecarga', () => {
  let fixture: ComponentFixture<OverloadResolutionDialogComponent>;
  let component: OverloadResolutionDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports:[OverloadResolutionDialogComponent]})
      .overrideComponent(OverloadResolutionDialogComponent,{set:{template:''}}).compileComponents();
    fixture = TestBed.createComponent(OverloadResolutionDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('conflict',{exceeds:true,plannedHours:8,limitHours:6,exceedsBy:2});
    fixture.componentRef.setInput('initialDate','2026-11-01');
    fixture.componentRef.setInput('initialHours',3);
    fixture.componentRef.setInput('eventDay','2026-11-10');
    fixture.detectChanges();
  });

  it('solo emite una reducción que deja el día dentro del límite', () => {
    const reduce = jasmine.createSpy('reduce');
    component.reduce.subscribe(reduce);

    expect(component.maxHours).toBe(1);
    component.hours = 2;
    expect(component.reduceError).toContain('máximo 1 h');
    component.confirmReduce();
    expect(reduce).not.toHaveBeenCalled();

    component.hours = 1;
    component.confirmReduce();
    expect(reduce).toHaveBeenCalledWith(1);
  });

  it('al elegir "Reducir horas" el campo ya trae el máximo que cabe', () => {
    component.chooseReduce();
    expect(component.action()).toBe('reduce-hours');
    expect(component.hours).toBe(1);
  });

  it('si el exceso cubre toda la gestión, no ofrece reducir', () => {
    fixture.componentRef.setInput('conflict',{exceeds:true,plannedHours:9,limitHours:6,exceedsBy:3});
    fixture.detectChanges();
    component.chooseReduce();
    expect(component.reduction.possible).toBeFalse();
    expect(component.action()).toBeNull();
  });

  it('avisa, sin bloquear, si la nueva fecha cae después del evento', () => {
    const move = jasmine.createSpy('move');
    component.move.subscribe(move);

    component.date = '2026-11-12';
    expect(component.dateWarning).toContain('posterior al evento');
    component.confirmMove();
    expect(move).toHaveBeenCalledWith('2026-11-12');
  });
});
