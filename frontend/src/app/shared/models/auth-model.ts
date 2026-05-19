import { ClienteResponse } from './cliente-model';
// import { FuncionarioResponse } from './funcionario-model';

// Enviado para o POST /auth/login
export interface LoginRequest {
  email: string;
  senha: string;
}

// O que o backend retorna
export interface LoginResponse {
  status: string;
  tipo: "funcionario" | "cliente";
  usuario: ClienteResponse; // | FuncionarioResponse;
}
