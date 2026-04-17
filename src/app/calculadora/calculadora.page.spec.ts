import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculadoraPage } from './calculadora.page';

describe('CalculadoraPage', () => {
  let component: CalculadoraPage;
  let fixture: ComponentFixture<CalculadoraPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CalculadoraPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
