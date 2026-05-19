export interface Agendamento {
  id: number;
  cliente: string;
  servico: string;
  barbeiro: string;
  data: string;
  hora: string;
  preco: number;
  status: 'confirmado' | 'pendente' | 'concluido';
}
