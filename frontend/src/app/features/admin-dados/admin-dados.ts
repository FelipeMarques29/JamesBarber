import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';
import { Navbar } from '../../shared/components/navbar/navbar';
import { DadosPanel } from '../../shared/components/dados-panel/dados-panel';

@Component({
  selector: 'app-admin-dados',
  imports: [CommonModule, Navbar, DadosPanel],
  templateUrl: './admin-dados.html',
  styleUrl: './admin-dados.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDados implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  ngOnInit(): void {
    if (!this.apiService.hasRole('admin')) {
      this.router.navigate(['/home']);
    }
  }
}
