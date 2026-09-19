import { TestBed } from '@angular/core/testing';

import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(ButtonComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
