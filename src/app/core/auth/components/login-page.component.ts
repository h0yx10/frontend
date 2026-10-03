import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH
} from '../models/auth.model';
import { AuthStore } from '../store/auth.store';
import { BrandLogoComponent } from '../../../shared/ui/atoms/brand-logo.component';
import { AppHttpError } from '../../interceptors/http-error.interceptor';

type AuthMode = 'login' | 'register';
type AuthField = 'name' | 'email' | 'password';

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
  imports: [ReactiveFormsModule, MatIconModule, BrandLogoComponent],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  readonly mode = signal<AuthMode>('login');

  readonly loading = signal(false);
  readonly error = signal('');
  readonly passwordVisible = signal(false);
  readonly serverFieldErrors = signal<Partial<Record<AuthField, string>>>({});
  readonly sessionExpired = signal(this.route.snapshot.queryParamMap.has('expired'));

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  readonly form = this.formBuilder.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, nonBlankValidator, Validators.email, Validators.maxLength(EMAIL_MAX_LENGTH)]],
    password: ['', [Validators.required, nonBlankValidator]]
  });

  constructor() {
    if (this.route.snapshot.data['mode'] === 'register') this.setMode('register');
    for (const field of ['name', 'email', 'password'] as const) {
      this.form.controls[field].valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.error.set('');
        this.serverFieldErrors.update((errors) => {
          const next = { ...errors };
          delete next[field];
          return next;
        });
      });
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private get returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return this.auth.canOrganize() && requested?.startsWith('/') && !requested.startsWith('//')
      && !/^\/(login|register)([/?#]|$)/.test(requested) ? requested : this.auth.homeUrl();
  }

  toggleMode(): void {
    this.router.navigate([this.mode() === 'login' ? '/register' : '/login'], {
      queryParamsHandling: 'preserve'
    });
  }

  fieldError(field: AuthField): string {
    const serverError = this.serverFieldErrors()[field];
    if (serverError) {
      return serverError;
    }

    const control = this.form.controls[field];
    if ((!control.touched && !control.dirty) || !control.errors) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return field === 'name'
        ? 'Escribe un nombre.'
        : field === 'email'
          ? 'Escribe tu correo.'
          : 'Escribe tu contrasena.';
    }
    if (errors['email']) {
      return 'Escribe un correo valido.';
    }
    if (errors['passwordSize']) {
      return 'La contrasena debe tener al menos 8 caracteres y un maximo de 72 bytes UTF-8.';
    }
    if (errors['maxlength']) {
      return field === 'name' ? 'El nombre puede tener maximo 120 caracteres.' : 'Escribe un correo valido.';
    }
    return '';
  }

  submit(): void {
    if (this.loading()) return;
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
      name.setValidators([Validators.required, nonBlankValidator, Validators.maxLength(NAME_MAX_LENGTH)]);
      password.setValidators([
        Validators.required,
        nonBlankValidator,
        passwordSizeValidator
      ]);
    } else {
      name.clearValidators();
      password.setValidators([Validators.required, nonBlankValidator]);
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

const passwordSizeValidator: ValidatorFn = (control) => {
  const value = control.value as string;
  if (!value) return null;
  return Array.from(value).length < PASSWORD_MIN_LENGTH || new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES
    ? { passwordSize: true } : null;
};

/** Detecta campos compuestos solo por espacios sin modificar el valor enviado. */
const nonBlankValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && !control.value.trim() ? { required: true } : null;
