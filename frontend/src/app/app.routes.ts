import { Routes } from '@angular/router';
import { Login } from './features/acesso/login/login'; // Ajuste o caminho para o seu arquivo de login
import { Cadastro } from './features/acesso/cadastro/cadastro';
import { Home } from './features/home/home'; // Importe a tela de home

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro }, // O 'path' deve ser exatamente 'cadastro'
  { path: 'home', component: Home }, // Adicione esta rota para a tela de home
  { path: '**', redirectTo: '' }
];
