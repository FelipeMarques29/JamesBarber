import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Navbar } from '@shared/components/navbar/navbar';

@Component({
  selector: 'app-funcionarios',
  imports: [CommonModule, Navbar, RouterLink],
  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.css',
})

export class Funcionarios {}
