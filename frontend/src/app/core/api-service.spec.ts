import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ApiService } from './api-service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request only funcionarios with funcao barbeiro', () => {
    service.listarBarbeiros().subscribe();

    const req = httpMock.expectOne((request) => {
      return request.method === 'GET' && request.url.includes('/clientes/');
    });

    expect(req.request.params.get('funcao')).toBe('barbeiro');
    expect(req.request.params.get('status')).toBe('funcionario');

    req.flush([]);
  });
});
