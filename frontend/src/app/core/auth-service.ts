import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

import { environment } from '../../environments/environment';

const app  = initializeApp(environment.firebase);
const auth = getAuth(app);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  usuarioFirebase = signal<any>(null);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.usuarioFirebase.set(user);
    });
  }

  async reenviarVerificacao() {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
    }
  }

  async login(email: string, senha: string) {
    return signInWithEmailAndPassword(auth, email, senha);
  }

  async cadastrar(email: string, senha: string) {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    // envia email de verificação
    await sendEmailVerification(credencial.user);
    return credencial;
  }

  async logout() {
    await signOut(auth);
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  isLogado(): boolean {
    return !!this.usuarioFirebase();
  }

  async getToken(): Promise<string | null> {
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
  }
}
