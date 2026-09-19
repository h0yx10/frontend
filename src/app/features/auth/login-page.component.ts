import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AppHttpError } from '../../core/interceptors/http-error.interceptor';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly demoLoading = signal(false);
  readonly error = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});

  name = '';
  email = '';
  password = '';

  private get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/hoy';
  }

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.error.set('');
    this.fieldErrors.set({});
  }

  continueAsDemo(): void {
    this.demoLoading.set(true);
    this.error.set('');

    this.auth
      .login({ email: 'demo@eventos.test', password: 'demo1234' })
      .pipe(finalize(() => this.demoLoading.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl(this.returnUrl),
        error: (error: AppHttpError) => this.error.set(error.message)
      });
  }

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.fieldErrors.set({});

    const request =
      this.mode() === 'login'
        ? this.auth.login({ email: this.email, password: this.password })
        : this.auth.register({ name: this.name, email: this.email, password: this.password });

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (error: AppHttpError) => {
        this.error.set(error.message);
        this.fieldErrors.set(error.fieldErrors ?? {});
      }
    });
  }
}
