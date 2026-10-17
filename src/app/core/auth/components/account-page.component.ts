import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthStore } from '../store/auth.store';
import { UpdateProfileRequestDto } from '../models/auth.model';
import { ConfirmDialogComponent } from '../../../shared/ui/molecules/confirm-dialog.component';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './account-page.component.html'
})
export class AccountPageComponent {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly confirmDelete = signal(false);
  readonly form = new FormGroup({
    nombre: new FormControl(this.auth.user()?.name ?? '', { nonNullable: true }),
    correo: new FormControl(this.auth.user()?.email ?? '', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    passwordActual: new FormControl('', { nonNullable: true })
  });

  save(): void {
    if (this.busy()) return;
    const values = this.form.getRawValue();
    const body: UpdateProfileRequestDto = { nombre: values.nombre.trim(), correo: values.correo.trim() };
    if (values.password) {
      body.password = values.password;
      body.passwordActual = values.passwordActual;
    }
    this.busy.set(true);
    this.message.set('');
    this.auth.updateProfile(body).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.form.patchValue({ nombre: response.data.name, correo: response.data.email, password: '', passwordActual: '' });
      },
      error: (error: Error) => this.message.set(error.message)
    });
  }

  deleteAccount(): void {
    this.confirmDelete.set(false);
    if (this.busy()) return;
    this.busy.set(true);
    this.auth.deleteAccount().pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (error: Error) => this.message.set(error.message)
    });
  }
}
