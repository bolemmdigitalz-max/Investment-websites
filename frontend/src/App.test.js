import { render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';

jest.mock('axios');
// react-github-btn ships untranspiled ES modules which Jest cannot parse.
jest.mock('react-github-btn', () => ({ children }) => <span>{children}</span>);

beforeEach(() => {
  localStorage.clear();
  axios.post.mockResolvedValue({ data: { msg: 'Success' } });
  axios.get.mockResolvedValue({ data: { isAdmin: false } });
});

const renderApp = () => render(
  <MemoryRouter>
    <App />
  </MemoryRouter>
);

const nav = () => within(screen.getByRole('navigation'));

test('renders the brand and a login link when logged out', () => {
  renderApp();
  expect(nav().getByRole('link', { name: /SPARK investment website/i })).toBeInTheDocument();
  expect(nav().getByRole('link', { name: /login/i })).toBeInTheDocument();
  expect(nav().queryByRole('link', { name: /logout/i })).not.toBeInTheDocument();
  expect(screen.getByText(/please/i)).toHaveTextContent(/login/i);
});

test('renders the navigation for a logged-in user', async () => {
  // header.payload.signature with exp far in the future (year 2286)
  const payload = btoa(JSON.stringify({ sub: 'test', exp: 9999999999 }));
  localStorage.setItem('token', `header.${payload}.sig`);

  renderApp();
  expect(await nav().findByRole('link', { name: /logout/i })).toBeInTheDocument();
  expect(nav().getByRole('link', { name: /request/i })).toBeInTheDocument();
  expect(nav().getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  expect(nav().getByRole('link', { name: /personal/i })).toBeInTheDocument();
  expect(nav().queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/validate', null, expect.anything()));
});

test('shows the admin link for an admin user', async () => {
  axios.get.mockResolvedValue({ data: { isAdmin: true } });
  const payload = btoa(JSON.stringify({ sub: 'root', exp: 9999999999 }));
  localStorage.setItem('token', `header.${payload}.sig`);

  renderApp();
  expect(await nav().findByRole('link', { name: /admin/i })).toBeInTheDocument();
});

test('discards an expired token', () => {
  const payload = btoa(JSON.stringify({ sub: 'test', exp: 1 }));
  localStorage.setItem('token', `header.${payload}.sig`);

  renderApp();
  expect(nav().getByRole('link', { name: /login/i })).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});
