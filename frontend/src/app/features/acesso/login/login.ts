import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '@core/auth-service';
import { ApiService } from '@core/api-service';
import { LoginRequest, LoginResponse } from '@shared/models/auth-model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private apiService  = inject(ApiService);
  private router      = inject(Router);

  usuario: LoginRequest = { email: '', senha: '' };
  erro = signal('');
  carregando = signal(false);

  async fazerLogin() {
    this.erro.set('');
    this.carregando.set(true);

    try {
      const credencial = await this.authService.login(this.usuario.email, this.usuario.senha);

      // bloqueia se email não foi verificado
      // if (!credencial.user.emailVerified) {
      //   await this.authService.logout();
      //   this.erro.set('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
      //   this.carregando.set(false);
      //   return;
      // }

      this.apiService.login(this.usuario).subscribe({
        next: (res: LoginResponse) => {
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.carregando.set(false);
          this.router.navigate(['/home']);
        },
        error: () => {
          this.erro.set('Erro ao carregar perfil.');
          this.carregando.set(false);
        }
      });

    } catch (e: any) {
      this.erro.set(this.traduzirErro(e.code));
      this.carregando.set(false);
    }
  }

  private traduzirErro(code: string): string {
    const erros: Record<string, string> = {
      'auth/invalid-email':      'E-mail inválido.',
      'auth/user-not-found':     'Usuário não encontrado.',
      'auth/wrong-password':     'Senha incorreta.',
      'auth/too-many-requests':  'Muitas tentativas. Tente mais tarde.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
    };
    return erros[code] ?? 'Erro ao fazer login.';
  }

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }

  irParaRecuperarSenha() {
    this.router.navigate(['/recuperar-senha']);
  }
}
