// models/cliente.model.ts

// Usado no formulário de cadastro
export interface ClienteCreate {
  nome: string;
  email: string;
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
  deve_trocar_senha?: boolean;
  jornada_inicio?: string;
  jornada_fim?: string;
  almoco_inicio?: string;
  almoco_fim?: string;
}

export interface ClienteLista {
  id: string;
  nome: string;
  email: string;
  status: string;
  funcao: string | null;
  jornada_inicio?: string;
  jornada_fim?: string;
  almoco_inicio?: string;
  almoco_fim?: string;
}
