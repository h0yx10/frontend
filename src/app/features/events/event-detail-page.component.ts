import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { formatDateTimeHuman } from '../../core/utils/date.util';
import { ConfirmDialogComponent } from '../../shared/ui/molecules/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { ProgressBarComponent } from '../../shared/ui/atoms/progress-bar.component';
import { EventFormComponent } from './components/event-form.component';
import { PostponeDialogComponent } from './components/postpone-dialog.component';
import { RescheduleDialogComponent } from './components/reschedule-dialog.component';
import { SubtaskColumnComponent } from './components/subtask-column.component';
import { SubtaskFormComponent } from './components/subtask-form.component';
import { EventPayload } from './models/event.model';
import { Subtask } from './models/subtask.model';
import { EventDetailStore } from './store/event-detail.store';

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    EventFormComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    SubtaskColumnComponent,
    SubtaskFormComponent,
    PostponeDialogComponent,
    RescheduleDialogComponent
  ],
  providers: [EventDetailStore],
  templateUrl: './event-detail-page.component.html'
})
export class EventDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(EventDetailStore);
  readonly formatDateTimeHuman = formatDateTimeHuman;

  readonly editingEvent = signal(false);
  readonly deleteEventConfirm = signal(false);
  readonly subtaskDialogOpen = signal(false);
  readonly subtaskEditing = signal<Subtask | null>(null);
  readonly postponeTarget = signal<Subtask | null>(null);
  readonly rescheduleTarget = signal<Subtask | null>(null);
  readonly deleteSubtaskTarget = signal<Subtask | null>(null);

  readonly pendingSubtasks = computed(() => this.store.subtasks().filter((s) => s.status === 'PENDING'));
  readonly postponedSubtasks = computed(() => this.store.subtasks().filter((s) => s.status === 'POSTPONED'));
  readonly doneSubtasks = computed(() => this.store.subtasks().filter((s) => s.status === 'DONE'));

  readonly plannedHours = computed(() =>
    this.store.subtasks().reduce((total, s) => total + s.estimatedHours, 0)
  );

  readonly daysUntilEvent = computed(() => {
    const event = this.store.event();
    if (!event) {
      return null;
    }
    const diffMs = new Date(event.datetime).getTime() - Date.now();
    return Math.round(diffMs / 86_400_000);
  });

  readonly shortId = computed(() => {
    const event = this.store.event();
    if (!event) {
      return '';
    }
    return `#${event.id.split('-').pop()?.slice(0, 6).toUpperCase() ?? ''}`;
  });

  readonly subtitleLine = computed(() => {
    const event = this.store.event();
    if (!event) {
      return '';
    }
    return [event.contact, formatDateTimeHuman(event.datetime), event.place]
      .filter((part) => !!part)
      .join(' · ');
  });

  readonly contactName = computed(() => this.store.event()?.contact.split('·')[0]?.trim() ?? '');
  readonly contactDetail = computed(() => {
    const parts = this.store.event()?.contact.split('·') ?? [];
    return parts.slice(1).join('·').trim();
  });
  readonly contactInitials = computed(() =>
    this.contactName()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  );

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.store.load(id);
      }
    });
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.load(id);
    }
  }

  saveEvent(payload: EventPayload): void {
    this.store.updateEvent(payload, () => this.editingEvent.set(false));
  }

  deleteEvent(): void {
    this.store.deleteEvent(() => this.router.navigate(['/progreso']));
  }

  openAddSubtask(): void {
    this.subtaskEditing.set(null);
    this.subtaskDialogOpen.set(true);
  }

  openEditSubtask(subtask: Subtask): void {
    this.subtaskEditing.set(subtask);
    this.subtaskDialogOpen.set(true);
  }

  closeSubtaskDialog(): void {
    this.subtaskDialogOpen.set(false);
    this.subtaskEditing.set(null);
  }

  markDone(subtask: Subtask): void {
    this.store.executeSubtask(subtask.id, { status: 'DONE' });
  }

  deleteSubtaskConfirmed(): void {
    const subtask = this.deleteSubtaskTarget();
    if (subtask) {
      this.store.deleteSubtask(subtask.id);
      this.deleteSubtaskTarget.set(null);
    }
  }
}
