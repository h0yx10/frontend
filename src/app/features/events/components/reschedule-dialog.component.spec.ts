import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ToastService } from '../../../core/feedback/toast.service';
import { OverloadCheckResult } from '../models/conflict.model';
import { Subtask } from '../models/subtask.model';
import { ConflictsService } from '../services/conflicts.service';
import { SubtasksService } from '../services/subtasks.service';
import { RescheduleDialogComponent } from './reschedule-dialog.component';

const task: Subtask = {
  id:'task',eventId:'event',eventName:'Evento',name:'Buscar proveedor',description:null,
  targetDate:'2026-11-01',estimatedHours:2,status:'PENDING',note:null,doneAt:null,createdAt:'2026-10-06'
};
const overloaded: OverloadCheckResult = {exceeds:true,plannedHours:8,limitHours:6,exceedsBy:2};
const free: OverloadCheckResult = {exceeds:false,plannedHours:2,limitHours:6,exceedsBy:0};

describe('RescheduleDialogComponent: aviso por fecha posterior al evento', () => {
  let fixture: ComponentFixture<RescheduleDialogComponent>;
  let component: RescheduleDialogComponent;
  let conflicts: jasmine.SpyObj<ConflictsService>;
  let subtasks: jasmine.SpyObj<SubtasksService>;

  beforeEach(async () => {
    conflicts = jasmine.createSpyObj<ConflictsService>('ConflictsService',['checkOverload']);
    subtasks = jasmine.createSpyObj<SubtasksService>('SubtasksService',['update','execute']);
    await TestBed.configureTestingModule({imports:[RescheduleDialogComponent],providers:[
      {provide:ConflictsService,useValue:conflicts},{provide:SubtasksService,useValue:subtasks}
    ]}).overrideComponent(RescheduleDialogComponent,{set:{template:''}}).compileComponents();
    fixture = TestBed.createComponent(RescheduleDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('subtask',task);
  });

  function requestedDates(): string[] {
    return conflicts.checkOverload.calls.allArgs().map(([, payload]) => payload.targetDate);
  }

  it('sugiere los tres días siguientes y marca los que caen después del evento', () => {
    fixture.componentRef.setInput('maxDate','2026-11-02');
    fixture.detectChanges();
    conflicts.checkOverload.and.callFake((_id, payload) => of(payload.targetDate === '2026-11-01' ? overloaded : free));

    component.checkAndSave();

    expect(requestedDates()).toEqual(['2026-11-01','2026-11-02','2026-11-03','2026-11-04']);
    expect(component.suggestions().map(s => s.date)).toEqual(['2026-11-02','2026-11-03','2026-11-04']);
    expect(component.suggestions().map(s => component.isAfterEvent(s.date))).toEqual([false,true,true]);
  });

  it('avisa de una fecha posterior al evento pero la guarda', () => {
    fixture.componentRef.setInput('maxDate','2026-10-16');
    fixture.detectChanges();
    component.targetDate = '2026-10-18';
    conflicts.checkOverload.and.returnValue(of(free));
    subtasks.update.and.returnValue(of({...task,targetDate:'2026-10-18'}));

    component.checkAndSave();

    expect(component.dateWarning).toContain('posterior al evento');
    expect(subtasks.update).toHaveBeenCalledWith('task',{targetDate:'2026-10-18'});
  });

  it('el máximo al reducir horas sale de las horas de la gestión, no de lo que se escribe', () => {
    fixture.detectChanges();
    conflicts.checkOverload.and.returnValue(of({exceeds:true,plannedHours:9,limitHours:6,exceedsBy:3}));
    const gestion = {...task,estimatedHours:5};
    fixture.componentRef.setInput('subtask',gestion);
    fixture.detectChanges();

    component.checkAndSave();
    expect(component.maxReducibleHours).toBe(2);

    component.reducedHours.set(1);
    expect(component.maxReducibleHours).toBe(2);
  });

  it('no deja confirmar una reducción que sigue superando el límite y confirma la que lo resuelve', () => {
    const toasts = TestBed.inject(ToastService);
    spyOn(toasts, 'show');
    fixture.componentRef.setInput('subtask',{...task,estimatedHours:5});
    fixture.detectChanges();
    conflicts.checkOverload.and.returnValue(of({exceeds:true,plannedHours:9,limitHours:6,exceedsBy:3}));
    component.checkAndSave();

    component.reducedHours.set(3);
    expect(component.reduceError).toContain('máximo 2 h');
    component.confirmReduceHours();
    expect(subtasks.update).not.toHaveBeenCalled();

    subtasks.update.and.returnValue(of({...task,estimatedHours:2}));
    component.reducedHours.set(2);
    component.confirmReduceHours();
    expect(subtasks.update).toHaveBeenCalledWith('task',{estimatedHours:2,targetDate:'2026-11-01'});
    expect(toasts.show).toHaveBeenCalledWith(jasmine.stringMatching(/^Conflicto resuelto: .*quedan 6 h de 6 h\.$/));
  });

  it('tras un conflicto, mover a un día con espacio confirma que se resolvió con cifras', () => {
    const toasts = TestBed.inject(ToastService);
    spyOn(toasts, 'show');
    fixture.detectChanges();
    conflicts.checkOverload.and.callFake((_id, payload) => of(payload.targetDate === '2026-11-01' ? overloaded : free));
    subtasks.update.and.returnValue(of({...task,targetDate:'2026-11-02'}));

    component.checkAndSave();
    component.pickSuggestion('2026-11-02');
    component.checkAndSave();

    expect(toasts.show).toHaveBeenCalledWith(jasmine.stringMatching(/^Conflicto resuelto: «Buscar proveedor» pasó a otro día; .* quedan 2 h de 6 h\.$/));
  });

  it('no avisa cuando la fecha es el mismo día del evento', () => {
    fixture.componentRef.setInput('maxDate','2026-11-01');
    fixture.detectChanges();
    expect(component.dateWarning).toBe('');
  });

  it('si fallan las sugerencias deja el diálogo usable', () => {
    fixture.detectChanges();
    conflicts.checkOverload.and.callFake((_id, payload) =>
      payload.targetDate === '2026-11-01' ? of(overloaded) : throwError(() => new Error('400')));

    component.checkAndSave();

    expect(component.conflict()).toEqual(overloaded);
    expect(component.suggestions()).toEqual([]);
  });
});
