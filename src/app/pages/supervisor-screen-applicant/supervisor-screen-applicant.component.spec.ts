import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorScreenApplicantComponent } from './supervisor-screen-applicant.component';

describe('SupervisorScreenApplicantComponent', () => {
  let component: SupervisorScreenApplicantComponent;
  let fixture: ComponentFixture<SupervisorScreenApplicantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupervisorScreenApplicantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupervisorScreenApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
