import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerInterviewComponent } from './interviewer-interview.component';

describe('InterviewerInterviewComponent', () => {
  let component: InterviewerInterviewComponent;
  let fixture: ComponentFixture<InterviewerInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerInterviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewerInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
