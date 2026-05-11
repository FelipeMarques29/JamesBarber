import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { RouterOutlet, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ApiService } from '@core/api-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})

export class AppComponent implements OnInit {
  title = 'JamesBarber';

  private apiService = Inject(ApiService);


  ngOnInit() {
    // Mantive aqui para testar assim que a página carregar também
    console.log('Página carregada, testando conexão automática...');
  }
}
