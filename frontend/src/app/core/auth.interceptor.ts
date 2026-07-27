import { HttpInterceptorFn } from '@angular/common/http';
import { inject, NgZone } from '@angular/core';

import { from, switchMap, Observable } from 'rxjs';

import { AuthService } from './auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const zone = inject(NgZone);

  return new Observable(observer => {
    from(authService.getToken()).pipe(
      switchMap(token => {
        if (token) {
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next(authReq);
        }
        return next(req);
      })
    ).subscribe({
      next: (val) => zone.run(() => observer.next(val)),
      error: (err) => zone.run(() => observer.error(err)),
      complete: () => zone.run(() => observer.complete())
    });
  });
};
