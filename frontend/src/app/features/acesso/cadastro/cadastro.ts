import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';
import { AuthService } from '@core/auth-service';
import { ClienteCreate } from '@shared/models/cliente-model';

@Component({
  selector: 'app-cadastro',
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro {

  novoCliente: ClienteCreate = {
    nome: '',
    email: '',
    telefone: '',
  };

  senha = '';

  private apiService  = inject(ApiService);
  private authService = inject(AuthService);
  private router      = inject(Router);

  erro       = signal('');
  carregando = signal(false);

  async cadastrar() {
    this.erro.set('');
    this.carregando.set(true);

    try {
      // 1. cria no Firebase Auth
      await this.authService.cadastrar(this.novoCliente.email, this.senha);

      // 2. cria o perfil no Firestore via backend
      this.apiService.criarCliente(this.novoCliente).subscribe({
        next: () => {
          this.carregando.set(false);
          alert('Cadastro realizado! Verifique seu e-mail para ativar a conta.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.erro.set(err.error?.detail || 'Erro ao salvar perfil.');
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
      'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
      'auth/invalid-email':        'E-mail inválido.',
      'auth/weak-password':        'Senha muito fraca. Use pelo menos 6 caracteres.',
    };
    return erros[code] ?? 'Erro ao criar conta.';
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}
