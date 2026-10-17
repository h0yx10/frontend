import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { OverloadCheckResult } from '../models/conflict.model';
import { Subtask } from '../models/subtask.model';
import { ConflictsService } from '../services/conflicts.service';
import { SubtasksService } from '../services/subtasks.service';
import { RescheduleDialogComponent } from './reschedule-dialog.component';

const task: Subtask = {
  id:'task',eventId:'event',eventName:'Evento',name:'Buscar proveedor',
  targetDate:'2026-11-01',estimatedHours:2,status:'PENDING',postponeNote:null,doneAt:null,createdAt:'2026-10-06'
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
