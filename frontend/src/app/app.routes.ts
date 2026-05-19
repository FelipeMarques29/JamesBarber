import { Routes } from '@angular/router';

import { Login } from './features/acesso/login/login';
import { Cadastro } from './features/acesso/cadastro/cadastro';
import { Home } from './features/home/home';
import { Agendamentos } from './features/agendamentos/agendamentos';
import { Avaliacao } from './features/avaliacao/avaliacao';
import { Servicos } from './features/servicos/servicos';
import { Dashboard } from '@features/dashboard/dashboard';
import { Funcionarios } from '@features/funcionarios/funcionarios';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro },
  { path: 'home', component: Home },
  { path: 'agendamentos', component: Agendamentos },
  { path: 'avaliacao', component: Avaliacao },
  { path: 'servicos', component: Servicos },
  { path: 'dashboard', component: Dashboard },
  { path: 'funcionarios', component: Funcionarios},
  { path: '**', redirectTo: '' }
];
