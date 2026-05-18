import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalentPoolComponent } from './talent-pool.component';

describe('TalentPoolComponent', () => {
  let component: TalentPoolComponent;
  let fixture: ComponentFixture<TalentPoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalentPoolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TalentPoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
