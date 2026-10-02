import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH
} from '../../core/auth/auth.model';
import { AuthService } from '../../core/auth/auth.service';
import { AppHttpError } from '../../core/interceptors/http-error.interceptor';

type AuthMode = 'login' | 'register';
type AuthField = 'name' | 'email' | 'password';

/** El backend puede nombrar los campos con el contrato en español. */
const BACKEND_FIELD_MAP: Record<string, AuthField> = {
  nombre: 'name',
  correo: 'email',
  password: 'password',
  name: 'name',
  email: 'email'
};

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<AuthMode>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly serverFieldErrors = signal<Partial<Record<AuthField, string>>>({});
  readonly sessionExpired = signal(this.route.snapshot.queryParamMap.has('expired'));

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(EMAIL_MAX_LENGTH)]
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  private get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/hoy';
  }

  toggleMode(): void {
    this.setMode(this.mode() === 'login' ? 'register' : 'login');
  }

  fieldError(field: AuthField): string {
    const serverError = this.serverFieldErrors()[field];
    if (serverError) {
      return serverError;
    }

    const control = this.form.controls[field];
    if (!control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return field === 'name'
        ? 'El nombre es obligatorio.'
        : field === 'email'
          ? 'El correo es obligatorio.'
          : 'La contraseña es obligatoria.';
    }
    if (errors['email']) {
      return 'Ingresa un correo válido.';
    }
    if (errors['minlength']) {
      return `La contraseña debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
    }
    if (errors['maxlength']) {
      return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    }
    return '';
  }

  submit(): void {
    this.error.set('');
    this.serverFieldErrors.set({});
    this.sessionExpired.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { name, email, password } = this.form.getRawValue();
    const request =
      this.mode() === 'login'
        ? this.auth.login({ email, password })
        : this.auth.register({ name, email, password });

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (error: AppHttpError) => {
        this.error.set(error.message);
        this.serverFieldErrors.set(mapServerFieldErrors(error.fieldErrors));
      }
    });
  }

  private setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.error.set('');
    this.serverFieldErrors.set({});

    const { name, password } = this.form.controls;
    if (mode === 'register') {
      name.setValidators([Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]);
      password.setValidators([
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH)
      ]);
    } else {
      name.clearValidators();
      password.setValidators([Validators.required]);
    }
    name.updateValueAndValidity();
    password.updateValueAndValidity();
    this.form.markAsUntouched();
  }
}

function mapServerFieldErrors(
  fieldErrors: Record<string, string> | undefined
): Partial<Record<AuthField, string>> {
  const mapped: Partial<Record<AuthField, string>> = {};
  Object.entries(fieldErrors ?? {}).forEach(([field, message]) => {
    const target = BACKEND_FIELD_MAP[field];
    if (target) {
      mapped[target] = message;
    }
  });
  return mapped;
}
