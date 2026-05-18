import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorInterviewComponent } from './supervisor-interview.component';

describe('SupervisorInterviewComponent', () => {
  let component: SupervisorInterviewComponent;
  let fixture: ComponentFixture<SupervisorInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupervisorInterviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupervisorInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
