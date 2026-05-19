import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule} from '@angular/forms';
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

  fazerLogin() {

    this.apiService.login(this.usuario).subscribe({
      next: (res: LoginResponse) => {

        // ← salva ANTES de navegar
        localStorage.setItem('usuario', JSON.stringify(res.usuario));

        // ← redireciona conforme o tipo
        if (res.tipo === 'funcionario') { //|| res.tipo === 'admin') {
          this.router.navigate(['/funcionario/home']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => alert('E-mail ou senha incorretos.')
    });
  }

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }
}
