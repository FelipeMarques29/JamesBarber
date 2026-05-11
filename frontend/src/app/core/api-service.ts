import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // Use a URL que aparece no seu Swagger (provavelmente localhost:8000)
  private readonly API_URL = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) { }

  // Exemplo: Buscar todos os agendamentos
  listarAgendamentos() {
    return this.http.get(`${this.API_URL}/agendamentos/`);
  }

  login(dados: any): Observable<any> {
    // O endpoint conforme seu Swagger é /clientes/login
    return this.http.post(`${this.API_URL}/clientes/login`, dados);
  }

  // Exemplo: Criar um novo cliente
  criarCliente(dados: any) {
    return this.http.post(`${this.API_URL}/clientes/`, dados);
  }
}
