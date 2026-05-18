import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewerHeaderComponent } from './reviewer-header.component';

describe('ReviewerHeaderComponent', () => {
  let component: ReviewerHeaderComponent;
  let fixture: ComponentFixture<ReviewerHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewerHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
