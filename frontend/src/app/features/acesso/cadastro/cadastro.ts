import { CommonModule } from '@angular/common'; // Para diretivas como *ngIf ou *ngFor
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms'; // OBRIGATÓRIO para usar o [(ngModel)]
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';
import { CadastroCliente } from '@shared/models/cliente.model';

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
  novoCliente: CadastroCliente = {
    cliente_nome: '',
    cliente_email: '',
    cliente_telefone: '',
    cliente_senha: ''
  };

  private apiService = inject(ApiService);
  private router = inject(Router);

  cadastrar() {
    // Aqui você chamaria o seu AuthService para enviar ao FastAPI
    console.log('Enviando para o Firebase via FastAPI:', this.novoCliente);

// 3. Chamada REAL para o serviço
    this.apiService.criarCliente(this.novoCliente).subscribe({
      next: (res) => {
        console.log('Sucesso:', res);
        alert('Cadastro realizado com sucesso!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erro ao cadastrar:', err);
        // O detail vem do "raise HTTPException" do seu Python
        alert('Erro: ' + (err.error?.detail || 'Falha na conexão com o servidor'));
      }
    });
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}
