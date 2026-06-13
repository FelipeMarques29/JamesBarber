import { Routes } from '@angular/router';

import { Login } from './features/acesso/login/login';
import { Cadastro } from './features/acesso/cadastro/cadastro';
import { RecuperarSenha } from './features/acesso/recuperar-senha/recuperar-senha';
import { Home } from './features/home/home';
import { Agendamentos } from './features/agendamentos/agendamentos';
import { Calendario } from './features/calendario/calendario';
import { Avaliacao } from './features/avaliacao/avaliacao';
import { Sobre } from './features/sobre/sobre';
import { AdminDados } from './features/admin-dados/admin-dados';
import { Servicos } from './features/servicos/servicos';
import { Dashboard } from '@features/dashboard/dashboard';
import { Funcionarios } from '@features/funcionarios/funcionarios';
import { Faturamento } from '@features/faturamento/faturamento';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro },
  { path: 'recuperar-senha', component: RecuperarSenha },
  { path: 'home', component: Home },
  { path: 'agendamentos', component: Agendamentos },
  { path: 'calendario', component: Calendario },
  { path: 'avaliacao', component: Avaliacao },
  { path: 'sobre', component: Sobre },
  { path: 'admin-dados', component: AdminDados },
  { path: 'faturamento', component: Faturamento },
  { path: 'servicos', component: Servicos },
  { path: 'dashboard', component: Dashboard },
  { path: 'funcionarios', component: Funcionarios},
  { path: '**', redirectTo: '' }
];
