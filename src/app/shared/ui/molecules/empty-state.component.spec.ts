import { TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(EmptyStateComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
