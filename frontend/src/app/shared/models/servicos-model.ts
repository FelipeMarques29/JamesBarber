export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: TipoServico;
  preco: number;
  ativo: boolean;
}

export type TipoServico =
  | 'corte'
  | 'barba'
  | 'corte_barba'
  | 'hidratacao'
  | 'coloracao'
  | 'sobrancelha';

export interface ServicoCreate {
  nome: string;
  descricao?: string | null;
  tipo: TipoServico;
  preco: number;
}

export interface ServicoUpdate {
  nome?: string;
  descricao?: string | null;
  tipo?: TipoServico;
  preco?: number;
  ativo?: boolean;
}
