import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ClienteCreate, ClienteResponse, ClienteLista } from '@shared/models/cliente-model';
import { LoginRequest, LoginResponse } from '@shared/models/auth-model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // Use a URL que aparece no seu Swagger (provavelmente localhost:8000)
  // private readonly API_URL = 'http://127.0.0.1:8000';
  private readonly API_URL = 'http://192.168.15.2:8000';

  constructor(private http: HttpClient) { }

  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, dados);
  }

  isAdmin(): boolean {
    const dados = localStorage.getItem('usuario');
    if (!dados) return false;

    try {
      const usuario = JSON.parse(dados);
      return usuario.status === 'admin';
    } catch (e) {
      return false;
    }
  }

  // Exemplo: Criar um novo cliente
  criarCliente(dados: ClienteCreate): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(`${this.API_URL}/clientes/`, dados);
  }

  listarClientes(email?: string): Observable<ClienteLista[]> {
    const params: Record<string, string> = {};
    if (email) params['email'] = email;
    return this.http.get<ClienteLista[]>(`${this.API_URL}/clientes/`, { params });
  }


  promoverCliente(
    id: string,
    status: 'cliente' | 'funcionario' | 'admin',
    funcao?: string
  ): Observable<any> {
    const params: any = { status };
    if (funcao) params['funcao'] = funcao;
    return this.http.patch(`${this.API_URL}/clientes/${id}/promover`, null, { params});
  }

  // Exemplo: Buscar todos os agendamentos
  listarAgendamentos() {
    return this.http.get(`${this.API_URL}/agendamentos/`);
  }
}
