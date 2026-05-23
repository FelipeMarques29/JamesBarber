import { ClienteLista } from './cliente-model';

export interface BarbeiroCard extends ClienteLista {
  experiencia: number;
  especialidade: string;
  descricao: string;
}

export const MOCK_EXTRA: Record<string, { experiencia: number; especialidade: string; descricao: string }> = {
  default: {
    experiencia: 3,
    especialidade: 'Corte Clássico',
    descricao: 'Profissional dedicado, com foco em qualidade e atenção aos detalhes.',
  },
};

export const ESPECIALIDADES = ['Corte Clássico', 'Barba & Bigode', 'Degradê', 'Navalhado'];
