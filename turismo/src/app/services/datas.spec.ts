import { TestBed } from '@angular/core/testing';

import { Datas } from './datas';

describe('Datas', () => {
  let service: Datas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Datas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
