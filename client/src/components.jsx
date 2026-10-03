import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, roleHome } from './auth';

export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
export function RoleProtectedRoute({ roles }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? (
    <Outlet />
  ) : (
    <Navigate to={user ? roleHome(user.role) : '/login'} replace />
  );
}
export function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links =
    user?.role === 'SYSTEM_ADMIN'
      ? [
          ['Dashboard', '/admin/dashboard'],
          ['Users', '/admin/users'],
          ['Stores', '/admin/stores'],
          ['Add user', '/admin/create-user'],
          ['Add store', '/admin/create-store'],
        ]
      : user?.role === 'STORE_OWNER'
        ? [
            ['Dashboard', '/owner/dashboard'],
            ['Ratings', '/owner/ratings'],
          ]
        : [['Stores', '/user/stores']];
  const passwordPath =
    user.role === 'SYSTEM_ADMIN'
      ? '/admin/change-password'
      : user.role === 'STORE_OWNER'
        ? '/owner/change-password'
        : '/user/change-password';
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link className="text-xl font-black tracking-tight text-ink" to={roleHome(user.role)}>
            Store<span className="text-teal">Score</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">{user.name}</span>
            <button
              className="text-sm font-semibold text-slate-600 hover:text-teal"
              onClick={() => navigate(passwordPath)}
            >
              Password
            </button>
            <button
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[210px_1fr]">
        <nav
          aria-label="Main navigation"
          className="flex gap-2 overflow-x-auto md:block md:space-y-1"
        >
          {links.map(([label, path]) => (
            <Link
              key={path}
              to={path}
              className="block shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-teal/10 hover:text-teal"
            >
              {label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export function Page({ title, subtitle, children, action }) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Field({ label, ...props }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
        {...props}
      />
    </label>
  );
}
export function Notice({ children, error }) {
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
    >
      {children}
    </p>
  );
}
export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
export function Loading() {
  return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>;
}
export function ErrorText({ error }) {
  return error ? (
    <Notice error>
      {error.response?.data?.message || 'Something went wrong. Please try again.'}
    </Notice>
  ) : null;
}
export function Stars({ value = 0, onChange, label = 'Rating' }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={value === n}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`text-xl leading-none focus:outline-none focus:ring-2 focus:ring-teal ${n <= value ? 'text-amber-400' : 'text-slate-300'} disabled:cursor-default`}
        >
          ★
        </button>
      ))}
      {value > 0 && <span className="ml-1 text-xs text-slate-500">{Number(value).toFixed(1)}</span>}
    </div>
  );
}
export function Pager({ page, pages, setPage }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>
        Page {page} of {Math.max(pages, 1)}
      </span>
      <div className="flex gap-2">
        <button
          className="rounded border px-3 py-1.5 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="rounded border px-3 py-1.5 disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
