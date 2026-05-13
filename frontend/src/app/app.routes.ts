import { Routes } from '@angular/router';
import { Login } from './features/acesso/login/login';
import { Cadastro } from './features/acesso/cadastro/cadastro';
import { Home } from './features/home/home';
import { Agendamentos } from './features/agendamentos/agendamentos';
import { Clientes } from './features/clientes/clientes';
import { Funcionarios } from './features/funcionarios/funcionarios';
import { Servicos } from './features/servicos/servicos';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro },
  { path: 'home', component: Home },
  { path: 'agendamentos', component: Agendamentos },
  { path: 'clientes', component: Clientes },
  { path: 'funcionarios', component: Funcionarios },
  { path: 'servicos', component: Servicos },
  { path: '**', redirectTo: '' }
];
