import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Navbar } from '../../shared/components/navbar/navbar'

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    Navbar
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
