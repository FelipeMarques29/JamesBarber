import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';
import { ClienteCreate } from '@shared/models/cliente-model';

@Component({
  selector: 'app-cadastro',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})

export class Cadastro {

  // Objeto seguindo o modelo do seu backend
  novoCliente: ClienteCreate = {
    nome: '',
    email: '',
    telefone: '',
    senha: ''
  };

  private apiService = inject(ApiService);
  private router = inject(Router);

  cadastrar() {

    this.apiService.criarCliente(this.novoCliente).subscribe({
      next: (res) => {
        alert('Cadastro realizado com sucesso!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erro ao cadastrar:', err);
        alert('Erro: ' + (err.error?.detail || 'Falha na conexão com o servidor'));
      }
    });
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}
