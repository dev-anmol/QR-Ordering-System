import { TestBed } from '@angular/core/testing';

import { UicartService } from './uicart.service';

describe('UicartService', () => {
  let service: UicartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UicartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
