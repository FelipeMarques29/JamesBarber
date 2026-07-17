import { Routes } from '@angular/router';

import { Login } from './features/acesso/login/login';
import { Cadastro } from './features/acesso/cadastro/cadastro';
import { RecuperarSenha } from './features/acesso/recuperar-senha/recuperar-senha';
import { DefinirSenha } from './features/acesso/definir-senha/definir-senha';
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
import { authGuard, adminGuard } from '@core/auth-guard';

export const routes: Routes = [
  // públicas
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro },
  { path: 'recuperar-senha', component: RecuperarSenha },

  // definir nova senha após entrar com a senha temporária
  { path: 'definir-senha', component: DefinirSenha, canActivate: [authGuard] },

  // exigem login (qualquer usuário)
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'agendamentos', component: Agendamentos, canActivate: [authGuard] },
  { path: 'calendario', component: Calendario, canActivate: [authGuard] },
  { path: 'avaliacao', component: Avaliacao, canActivate: [authGuard] },
  { path: 'sobre', component: Sobre, canActivate: [authGuard] },
  { path: 'servicos', component: Servicos, canActivate: [authGuard] },
  { path: 'funcionarios', component: Funcionarios, canActivate: [authGuard] },

  // exigem admin logado
  { path: 'admin-dados', component: AdminDados, canActivate: [adminGuard] },
  { path: 'faturamento', component: Faturamento, canActivate: [adminGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [adminGuard] },

  { path: '**', redirectTo: '' }
];
