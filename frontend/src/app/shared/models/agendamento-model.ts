export type StatusAgendamento =
  | 'Agendado'
  | 'Em andamento'
  | 'Concluído'
  | 'Cancelado';

export interface Agendamento {
  id: string;
  barbeiro_id: string;
  barbeiro_nome: string;
  cliente_id: string;
  cliente_nome: string;
  servico_id: string;
  servico_nome: string;
  data_hora: string;
  duracao_minutos: number;
  valor_total: number;
  status: StatusAgendamento;
  criado_em: string;
}

export interface AgendamentoCreate {
  barbeiro_id: string;
  cliente_id: string;
  servico_id: string;
  data_hora: string;
}

export interface HorariosLivresResponse {
  data: string;
  barbeiro_id: string;
  horarios_livres: string[];
}
