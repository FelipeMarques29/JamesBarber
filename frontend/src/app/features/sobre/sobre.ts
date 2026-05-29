import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Navbar } from '../../shared/components/navbar/navbar';

interface Competencia {
  titulo: string;
  descricao: string;
  icone: string;
}

@Component({
  selector: 'app-sobre',
  imports: [CommonModule, Navbar],
  templateUrl: './sobre.html',
  styleUrl: './sobre.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sobre {
  readonly competencias: Competencia[] = [
    {
      titulo: 'Cortes Premium',
      descricao: 'Degradês, undercut, social, low fade — técnicas modernas executadas por profissionais especializados em cada tipo de fio.',
      icone: 'scissors',
    },
    {
      titulo: 'Barba & Bigode',
      descricao: 'Modelagem com toalha quente, navalha e óleos essenciais. Acabamento perfeito que valoriza os traços do rosto.',
      icone: 'razor',
    },
    {
      titulo: 'Hidratação & Tratamentos',
      descricao: 'Produtos premium para nutrir cabelo e barba. Hidratação profunda, anti-queda e tratamentos capilares personalizados.',
      icone: 'bottle',
    },
    {
      titulo: 'Pigmentação Capilar',
      descricao: 'Camuflagem de fios brancos e disfarce de falhas com pigmentos naturais. Resultado discreto, duradouro e sem aspecto pintado.',
      icone: 'brush',
    },
    {
      titulo: 'Sobrancelha Masculina',
      descricao: 'Design e alinhamento com pinça e navalha respeitando o formato do rosto. Realce sutil que faz toda a diferença.',
      icone: 'eyebrow',
    },
    {
      titulo: 'Ambiente Sofisticado',
      descricao: 'Espaço climatizado com decoração premium, café gratuito, atendimento ágil e ambiente pensado para o seu conforto.',
      icone: 'lounge',
    },
  ];

  readonly anosNoMercado = new Date().getFullYear() - 2015;
}
