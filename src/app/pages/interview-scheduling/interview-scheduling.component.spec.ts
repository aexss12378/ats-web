import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewSchedulingComponent } from './interview-scheduling.component';

describe('InterviewSchedulingComponent', () => {
  let component: InterviewSchedulingComponent;
  let fixture: ComponentFixture<InterviewSchedulingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewSchedulingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewSchedulingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
