import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Importante para o AJAX
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Cliente {
  // Ajuste esta URL para a porta que seu FastAPI está rodando (ex: 8000)
  private apiUrl = 'http://localhost:8000/clientes';

  constructor(private http: HttpClient) { }

  // Método para Criar Cliente (POST /clientes/)
  criarCliente(cliente: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/`, cliente);
  }

  // Método para Login (POST /clientes/login)
  login(credenciais: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credenciais);
  }
}
