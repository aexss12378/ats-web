import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorDecisionComponent } from './supervisor-decision.component';

describe('SupervisorDecisionComponent', () => {
  let component: SupervisorDecisionComponent;
  let fixture: ComponentFixture<SupervisorDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupervisorDecisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupervisorDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
