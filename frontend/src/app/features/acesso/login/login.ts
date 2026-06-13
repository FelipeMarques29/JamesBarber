import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

import { ApiService } from '@core/api-service';
import { LoginRequest, LoginResponse } from '@shared/models/auth-model';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private apiService = inject(ApiService);
  private router = inject(Router);

  usuario: LoginRequest = {
    email: '',
    senha: ''
  };

  readonly senhaIncorreta = signal(false);

  fazerLogin() {
    this.senhaIncorreta.set(false);

    this.apiService.login(this.usuario).subscribe({
      next: (res: LoginResponse) => {
        localStorage.setItem('usuario', JSON.stringify(res.usuario));

        const status = res.usuario.status;

        if (status === 'admin') {
          this.router.navigate(['/agendamentos']);
        } else if (status === 'funcionario') {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.senhaIncorreta.set(true);
        } else {
          alert('E-mail ou senha incorretos.');
        }
      }
    });
  }

  irParaRecuperarSenha() {
    this.router.navigate(['/recuperar-senha']);
  }

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }
}
