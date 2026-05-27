// models/cliente.model.ts

// Usado no formulário de cadastro
export interface ClienteCreate {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
}

// Resposta que vem do backend após cadastro/busca
export interface ClienteResponse {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  funcao: string | null;
}

export interface ClienteLista {
  id: string;
  nome: string;
  email: string;
  status: string;
  funcao: string | null;
}
