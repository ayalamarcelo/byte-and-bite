import { TestBed } from '@angular/core/testing';
import { Nutrition } from './nutrition.service';

describe('Nutrition', () => {
  let service: Nutrition;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Nutrition);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
