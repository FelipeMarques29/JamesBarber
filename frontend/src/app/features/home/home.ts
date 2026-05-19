import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Navbar } from '@shared/components/navbar/navbar';

@Component({
  selector: 'app-home',
  imports: [CommonModule, Navbar, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
