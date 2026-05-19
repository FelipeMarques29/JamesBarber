import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-servicos',
  imports: [CommonModule, Navbar],
  templateUrl: './servicos.html',
  styleUrl: './servicos.css',
})
export class Servicos {}
