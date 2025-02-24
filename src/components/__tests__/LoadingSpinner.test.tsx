import { render } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeTruthy();
    expect(spinner?.className).toContain('h-8 w-8'); // medium size
    expect(spinner?.className).toContain('text-blue-600'); // default color
  });

  it('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner?.className).toContain('h-12 w-12');
  });

  it('renders with custom color', () => {
    const { container } = render(<LoadingSpinner color="text-red-600" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner?.className).toContain('text-red-600');
  });
});
