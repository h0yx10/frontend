import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EVENT_TYPE_SUGGESTIONS, EventPayload } from '../models/event.model';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-form.component.html'
})
export class EventFormComponent implements OnInit {
  readonly initial = input<EventPayload | null>(null);
  readonly fieldErrors = input<Record<string, string>>({});
  readonly saving = input(false);
  readonly submitLabel = input('Guardar');
  readonly showCancel = input(false);

  @Output() readonly save = new EventEmitter<EventPayload>();
  @Output() readonly cancel = new EventEmitter<void>();

  readonly typeSuggestions = EVENT_TYPE_SUGGESTIONS;

  name = '';
  type = '';
  contact = '';
  datetime = '';
  place = '';

  ngOnInit(): void {
    const initial = this.initial();
    if (initial) {
      this.name = initial.name;
      this.type = initial.type;
      this.contact = initial.contact;
      this.datetime = initial.datetime;
      this.place = initial.place;
    }
  }

  submit(): void {
    this.save.emit({
      name: this.name.trim(),
      type: this.type.trim(),
      contact: this.contact.trim(),
      datetime: this.datetime,
      place: this.place.trim()
    });
  }
}
