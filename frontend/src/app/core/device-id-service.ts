import { Injectable } from '@angular/core';

/**
 * Gera e mantém um identificador único por navegador/dispositivo, salvo no
 * localStorage. Usado para controlar a recuperação de senha por máquina.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceIdService {
  private static readonly STORAGE_KEY = 'device_id';

  getId(): string {
    try {
      const existente = localStorage.getItem(DeviceIdService.STORAGE_KEY);
      if (existente) {
        return existente;
      }

      const novo = this.gerarId();
      localStorage.setItem(DeviceIdService.STORAGE_KEY, novo);
      return novo;
    } catch {
      // localStorage indisponível (ex.: modo anônimo restrito): gera efêmero.
      return this.gerarId();
    }
  }

  private gerarId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    // Fallback para navegadores sem crypto.randomUUID.
    return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
