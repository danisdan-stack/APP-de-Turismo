import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltrosPage } from './filtros.page';

describe('FiltrosPage', () => {
  let component: FiltrosPage;
  let fixture: ComponentFixture<FiltrosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FiltrosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
