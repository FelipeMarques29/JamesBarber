import { environment } from './../../environments/environment.development';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Agendamento, AgendamentoCreate, HorariosLivresResponse } from '@shared/models/agendamento-model';
import { LoginRequest, LoginResponse, RecuperarSenhaRequest, RecuperarSenhaResponse } from '@shared/models/auth-model';
import { ClienteCreate, ClienteResponse, ClienteLista } from '@shared/models/cliente-model';
import { Servico, ServicoCreate, ServicoUpdate } from '@shared/models/servicos-model';


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // Use a URL que aparece no seu Swagger (provavelmente localhost:8000)
  private readonly API_URL = environment.apiUrl;
  // private readonly API_URL = 'http://127.0.0.1:8000';
  // private readonly API_URL = 'http://192.168.15.2:8000';

  constructor(private http: HttpClient) { }

  //LOGIN
  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, dados);
  }

  //RECUPERAR SENHA
  recuperarSenha(dados: RecuperarSenhaRequest): Observable<RecuperarSenhaResponse> {
    return this.http.post<RecuperarSenhaResponse>(`${this.API_URL}/auth/recuperar-senha`, dados);
  }

  //VERIFICA O TIPO DE USUARIO
  getUsuarioLogado(): any {
    try {
      const u = localStorage.getItem('usuario');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  hasRole(role: 'cliente' | 'funcionario' | 'admin'): boolean {
    const u = this.getUsuarioLogado();
    if (!u) return false;
    if (role === 'funcionario') return u.status === 'funcionario' || u.status === 'admin';
    return u.status === role;
  }

  isFuncionario(): boolean {
    const u = this.getUsuarioLogado();
    return u?.status === 'funcionario' || u?.status === 'admin';
  }


  // Exemplo: Criar um novo cliente
  criarCliente(dados: ClienteCreate): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(`${this.API_URL}/clientes/`, dados);
  }

  listarClientes(email?: string, limit?: number, startAfter?: string): Observable<ClienteLista[]> {
    const params: Record<string, any> = {};
    if (email) params['email'] = email;
    if (limit) params['limit'] = limit;
    if (startAfter) params['start_after'] = startAfter;
    return this.http.get<ClienteLista[]>(`${this.API_URL}/clientes/`, { params });
  }

  totalClientes(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.API_URL}/clientes/total`);
  }

  listarTodosClientes(limit = 20, startAfter?: string): Observable<ClienteLista[]> {
    const params: Record<string, any> = { status: 'cliente', limit };
    if (startAfter) params['start_after'] = startAfter;
    return this.http.get<ClienteLista[]>(`${this.API_URL}/clientes/`, { params });
  }

  //LISTA FUNCIONARIOS NO DASHBOARD
  listarFuncionarios(): Observable<ClienteLista[]> {
    return this.http.get<ClienteLista[]>(`${this.API_URL}/clientes/`, {
      params: { status: 'funcionario' }
    });
  }

  listarBarbeiros(): Observable<ClienteLista[]> {
    return this.http.get<ClienteLista[]>(`${this.API_URL}/clientes/`, {
      params: { funcao: 'barbeiro' }
    });
  }
  //LISTA FUNCIONARIOS NO DASHBOARD


  //DASHBOARD - transformar cliente em funcionario
  promoverCliente(
    id: string,
    status: 'cliente' | 'funcionario' | 'admin',
    funcao?: string
  ): Observable<any> {
    const params: any = { status };
    if (funcao) params['funcao'] = funcao;
    return this.http.patch(`${this.API_URL}/clientes/${id}/promover`, null, { params});
  }

  //DASHBOARD - atualizar jornada
  atualizarJornada(id: string, dados: any): Observable<any> {
    return this.http.patch(`${this.API_URL}/clientes/${id}/jornada`, dados);
  }
  //DASHBOARD - transformar cliente em funcionario


  //SERVIÇOS
  listarServicos(): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.API_URL}/servicos/`);
  }

  criarServico(dados: ServicoCreate): Observable<Servico> {
    return this.http.post<Servico>(`${this.API_URL}/servicos/`, dados);
  }

  atualizarServico(id: string, dados: ServicoUpdate): Observable<Servico> {
    return this.http.patch<Servico>(`${this.API_URL}/servicos/${id}`, dados);
  }

  deletarServico(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/servicos/${id}`);
  }
  //SERVIÇOS


  //CRIAR AGENDAMENTO
  criarAgendamento(dados: AgendamentoCreate): Observable<any> {
    return this.http.post(`${this.API_URL}/agendamentos/`, dados);
  }

  listarAgendamentos(filtros?: {
    barbeiro_id?: string;
    cliente_id?: string;
    status?: string;
    atualizado_apos?: string;
  }): Observable<Agendamento[]> {
    const params: Record<string, string> = {};
    if (filtros?.barbeiro_id)     params['barbeiro_id']     = filtros.barbeiro_id;
    if (filtros?.cliente_id)      params['cliente_id']      = filtros.cliente_id;
    if (filtros?.status)          params['status']          = filtros.status;
    if (filtros?.atualizado_apos) params['atualizado_apos'] = filtros.atualizado_apos;
    return this.http.get<Agendamento[]>(`${this.API_URL}/agendamentos/`, { params });
  }

  cancelarAgendamento(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/agendamentos/${id}`);
  }

  horariosLivres(barbeiro_id: string, data: string): Observable<HorariosLivresResponse> {
    return this.http.get<HorariosLivresResponse>(
      `${this.API_URL}/agendamentos/barbeiro/${barbeiro_id}/horarios-livres`,
      { params: { data } }
    );
  }
  //CRIAR AGENDAMENTO

  //cache
  gradeAdmin(data: string): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.API_URL}/agendamentos/grade`, { params: { data } });
  }
  //cache

  // BLOQUEIOS (Folga e Barbearia Fechada)
  listarBloqueios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/admin/bloqueios`);
  }

  criarBloqueio(dados: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/admin/bloqueios`, dados);
  }

  removerBloqueio(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/admin/bloqueios/${id}`);
  }
}
