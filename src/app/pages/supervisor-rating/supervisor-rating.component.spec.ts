import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorRatingComponent } from './supervisor-rating.component';

describe('SupervisorRatingComponent', () => {
  let component: SupervisorRatingComponent;
  let fixture: ComponentFixture<SupervisorRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupervisorRatingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupervisorRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
