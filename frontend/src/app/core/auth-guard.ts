import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ApiService } from '@core/api-service';

// Exige usuário logado (qualquer papel). Sem login → vai para /login.
export const authGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);

  if (api.getUsuarioLogado()) return true;
  return router.createUrlTree(['/login']);
};

// Exige admin logado. Não logado → /login; logado sem ser admin → /home.
export const adminGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);

  if (api.hasRole('admin')) return true;
  return router.createUrlTree([api.getUsuarioLogado() ? '/home' : '/login']);
};
