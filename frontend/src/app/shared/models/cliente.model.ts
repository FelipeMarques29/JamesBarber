export interface Cliente {
  id?: number;       // O '?' indica que é opcional (o banco gera o ID)
  nome: string;
  email: string;
  senha?: string;    // Usado no cadastro
  telefone?: string;
}

// Interface específica para o Login
export interface ClienteLogin {
  cliente_email: string;
  cliente_senha: string;
}

// Tem tudo do ClienteLogin mais o que está abaixo
export interface CadastroCliente extends ClienteLogin {
  cliente_nome: string;
  cliente_telefone: string;
}
