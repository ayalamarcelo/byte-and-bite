import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmSignupPage } from './confirm-signup.page';

describe('ConfirmSignupPage', () => {
  let component: ConfirmSignupPage;
  let fixture: ComponentFixture<ConfirmSignupPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmSignupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
