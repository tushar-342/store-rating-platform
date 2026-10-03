import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Stars } from './components';

describe('Stars', () => {
  it('announces the rating choices and reports the selected value', () => {
    let selected;
    render(
      <Stars
        value={2}
        onChange={(rating) => {
          selected = rating;
        }}
        label="Your rating"
      />
    );
    expect(screen.getByRole('group', { name: 'Your rating' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '4 stars' }));
    expect(selected).toBe(4);
  });
});
