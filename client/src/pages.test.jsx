import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { ProtectedRoute } from './components';
import { Login, Register } from './pages';

vi.mock('./api', () => ({ api: { post: vi.fn() }, getData: (response) => response.data.data }));

beforeEach(() => localStorage.clear());

describe('public account screens and route protection', () => {
  it('renders an accessible login form', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('does not expose role selection during registration', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor away from a protected page', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<p>Sign in required</p>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/private" element={<p>Private content</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Sign in required')).toBeInTheDocument();
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
  });
});
