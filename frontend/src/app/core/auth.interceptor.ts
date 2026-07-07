import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { from, switchMap } from 'rxjs';

import { AuthService } from './auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Obtém o token de forma assíncrona do Firebase Auth
  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (token) {
        // Clona a requisição adicionando o cabeçalho Authorization
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      // Se não houver token, envia a requisição original
      return next(req);
    })
  );
};
