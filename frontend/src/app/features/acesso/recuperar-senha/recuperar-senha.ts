import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';
import { DeviceIdService } from '@core/device-id-service';

@Component({
  selector: 'app-recuperar-senha',
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.css',
})
export class RecuperarSenha {
  private apiService = inject(ApiService);
  private deviceId = inject(DeviceIdService);
  private router = inject(Router);

  readonly email = signal('');
  readonly enviando = signal(false);
  readonly senhaTemporaria = signal<string | null>(null);
  readonly erro = signal<string | null>(null);

  enviar() {
    const email = this.email().trim();
    if (!email) {
      this.erro.set('Informe um e-mail válido.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    this.senhaTemporaria.set(null);

    this.apiService.recuperarSenha({ email, device_id: this.deviceId.getId() }).subscribe({
      next: (res) => {
        this.senhaTemporaria.set(res.senha_temporaria);
        this.enviando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.erro.set(this.mensagemDeErro(err));
        this.enviando.set(false);
      }
    });
  }

  private mensagemDeErro(err: HttpErrorResponse): string {
    if (err.status === 404) {
      return 'E-mail não cadastrado.';
    }
    // 429: aguardando o intervalo entre solicitações — usa a mensagem do backend.
    if (err.status === 429) {
      return err.error?.detail ?? 'Aguarde alguns minutos antes de solicitar uma nova senha.';
    }
    return 'Falha ao recuperar a senha.';
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}
