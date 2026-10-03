import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, getData } from './api';
import { roleHome, useAuth } from './auth';
import { Card, ErrorText, Field, Loading, Notice, Page, Pager, Stars } from './components';

const passwordHelp =
  'Use 8–16 characters, including one uppercase letter and one special character.';
export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data);
      navigate(location.state?.from?.pathname || roleHome(data.data.user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    }
  }
  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to your StoreScore account">
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <ErrorText error={error ? { response: { data: { message: error } } } : null} />
        <button className="w-full rounded-lg bg-ink px-4 py-3 font-bold text-white hover:bg-teal">
          Sign in
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{' '}
        <Link className="font-bold text-teal" to="/register">
          Create an account
        </Link>
      </p>
    </AuthFrame>
  );
}
export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    try {
      await api.post('/auth/register', form);
      setDone(true);
      setTimeout(() => navigate('/login'), 1300);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Unable to register'
      );
    }
  }
  return (
    <AuthFrame
      title="Create your account"
      subtitle="Join the community and share your store ratings"
    >
      {done && <Notice>Account created. Redirecting to sign in…</Notice>}
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field
          label="Full name (20–60 characters)"
          required
          minLength="20"
          maxLength="60"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Field
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Field
          label="Address (up to 400 characters)"
          maxLength="400"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Field
          label="Password"
          type="password"
          required
          minLength="8"
          maxLength="16"
          pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}"
          title={passwordHelp}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <p className="-mt-2 text-xs text-slate-500">{passwordHelp}</p>
        <Field
          label="Confirm password"
          type="password"
          required
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />
        <ErrorText error={error ? { response: { data: { message: error } } } : null} />
        <button className="w-full rounded-lg bg-ink px-4 py-3 font-bold text-white hover:bg-teal">
          Create account
        </button>
      </form>
    </AuthFrame>
  );
}
function AuthFrame({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 to-teal/10 px-4 py-8">
      <Card className="w-full max-w-md p-7 sm:p-9">
        <Link className="text-lg font-black text-ink" to="/login">
          Store<span className="text-teal">Score</span>
        </Link>
        <h1 className="mt-7 text-2xl font-black text-ink">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>
        {children}
      </Card>
    </div>
  );
}

export function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const r = await api.put('/auth/password', form);
      setMessage(r.data.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Unable to update password'
      );
    }
  }
  return (
    <Page title="Change password" subtitle="Keep your account secure with a strong password">
      <Card className="max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Current password"
            type="password"
            required
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
          <Field
            label="New password"
            type="password"
            required
            minLength="8"
            maxLength="16"
            pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}"
            title={passwordHelp}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
          <p className="-mt-2 text-xs text-slate-500">{passwordHelp}</p>
          <Field
            label="Confirm new password"
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
          <ErrorText error={error ? { response: { data: { message: error } } } : null} />
          {message && <Notice>{message}</Notice>}
          <button className="rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">
            Update password
          </button>
        </form>
      </Card>
    </Page>
  );
}

function Stats({ title, value, hint }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
export function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => getData(await api.get('/admin/dashboard')),
  });
  if (isLoading) return <Loading />;
  return (
    <Page title="Overview" subtitle="A live snapshot of your platform">
      <ErrorText error={error} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total users', data?.totalUsers],
          ['Stores', data?.totalStores],
          ['Ratings submitted', data?.totalRatings],
        ].map(([name, value]) => (
          <Stats key={name} title={name} value={value ?? '—'} />
        ))}
      </div>
      <Card className="mt-5">
        <h2 className="font-bold text-ink">Platform administration</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage user access, stores, and owner assignments from the navigation.
        </p>
      </Card>
    </Page>
  );
}
function usePaged(path, queryKey, extra = {}) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({});
  const query = useQuery({
    queryKey: [queryKey, page, sortBy, sortOrder, filters],
    queryFn: async () =>
      getData(
        await api.get(path, {
          params: {
            page,
            limit: 10,
            sortBy,
            sortOrder,
            ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
            ...extra,
          },
        })
      ),
  });
  function sort(key) {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  }
  return { page, setPage, sortBy, sortOrder, filters, setFilters, sort, ...query };
}
function SortHead({ columns, sortBy, sortOrder, onSort }) {
  return (
    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
      <tr>
        {columns.map(([label, key]) => (
          <th key={key} className="px-4 py-3">
            <button className="font-bold hover:text-teal" onClick={() => onSort(key)}>
              {label}
              {sortBy === key ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          </th>
        ))}
      </tr>
    </thead>
  );
}
function Listing({ title, subtitle, path, queryKey, columns, filterFields, transform }) {
  const q = usePaged(path, queryKey);
  return (
    <Page title={title} subtitle={subtitle}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filterFields.map(([label, key]) => (
          <Field
            key={key}
            label={label}
            placeholder={`Filter ${label.toLowerCase()}`}
            value={q.filters[key] || ''}
            onChange={(e) => {
              q.setPage(1);
              q.setFilters({ ...q.filters, [key]: e.target.value });
            }}
          />
        ))}
      </div>
      {q.isLoading ? (
        <Loading />
      ) : (
        <>
          <ErrorText error={q.error} />
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <SortHead
                  columns={columns}
                  sortBy={q.sortBy}
                  sortOrder={q.sortOrder}
                  onSort={q.sort}
                />
                <tbody className="divide-y divide-slate-100">
                  {(q.data?.items || []).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {columns.map(([, key]) => (
                        <td key={key} className="px-4 py-3 text-slate-700">
                          {transform?.(row, key) ?? row[key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!q.data?.items?.length && (
                <p className="p-8 text-center text-sm text-slate-500">No results found.</p>
              )}
            </div>
            <Pager page={q.data?.page || 1} pages={q.data?.totalPages || 0} setPage={q.setPage} />
          </Card>
        </>
      )}
    </Page>
  );
}
export function AdminUsers() {
  return (
    <Listing
      title="Users"
      subtitle="Browse, filter, and review platform accounts"
      path="/admin/users"
      queryKey="admin-users"
      columns={[
        ['Name', 'name'],
        ['Email', 'email'],
        ['Address', 'address'],
        ['Role', 'role'],
      ]}
      filterFields={[
        ['Name', 'name'],
        ['Email', 'email'],
        ['Address', 'address'],
        ['Role', 'role'],
      ]}
      transform={(row, key) =>
        key === 'name' ? (
          <Link className="font-semibold text-teal hover:underline" to={`/admin/users/${row.id}`}>
            {row.name}
          </Link>
        ) : undefined
      }
    />
  );
}
export function AdminStores() {
  return (
    <Listing
      title="Stores"
      subtitle="Store directory and community ratings"
      path="/admin/stores"
      queryKey="admin-stores"
      columns={[
        ['Name', 'name'],
        ['Email', 'email'],
        ['Address', 'address'],
        ['Rating', 'rating'],
      ]}
      filterFields={[
        ['Name', 'name'],
        ['Email', 'email'],
        ['Address', 'address'],
      ]}
      transform={(row, key) =>
        key === 'rating'
          ? row.averageRating === null
            ? 'N/A'
            : Number(row.averageRating).toFixed(1)
          : undefined
      }
    />
  );
}
export function AdminUserDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => getData(await api.get(`/admin/users/${id}`)),
  });
  if (isLoading) return <Loading />;
  return (
    <Page title="User details">
      <ErrorText error={error} />
      {data && (
        <Card className="max-w-2xl">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Name', data.name],
              ['Email', data.email],
              ['Address', data.address],
              ['Role', data.role],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase text-slate-400">{k}</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{v || '—'}</dd>
              </div>
            ))}
          </dl>
          {data.role === 'STORE_OWNER' && (
            <div className="mt-6 border-t pt-5">
              <h2 className="font-bold">Assigned stores</h2>
              {data.stores?.length ? (
                data.stores.map((s) => (
                  <p key={s.id} className="mt-2 text-sm">
                    {s.name} · {s.email} · {s.address} · Rating:{' '}
                    {s.averageRating === null ? 'N/A' : s.averageRating.toFixed(1)}
                  </p>
                ))
              ) : (
                <p className="mt-2 text-sm text-slate-500">No store assigned yet.</p>
              )}
            </div>
          )}
        </Card>
      )}
    </Page>
  );
}
export function CreateUser() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'NORMAL_USER',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/users', form);
      setMessage('User created successfully.');
      setForm({ name: '', email: '', address: '', password: '', role: 'NORMAL_USER' });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Unable to create user'
      );
    }
  }
  return (
    <Page title="Create user" subtitle="Set up an account and choose its role">
      <Card className="max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Full name (20–60 characters)"
            required
            minLength="20"
            maxLength="60"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Field
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Field
            label="Address"
            maxLength="400"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Field
            label="Temporary password"
            type="password"
            required
            minLength="8"
            maxLength="16"
            pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}"
            title={passwordHelp}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <label className="block text-sm font-semibold">
            Role
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {['NORMAL_USER', 'SYSTEM_ADMIN', 'STORE_OWNER'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <ErrorText error={error ? { response: { data: { message: error } } } : null} />
          {message && <Notice>{message}</Notice>}
          <button className="rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">
            Create account
          </button>
        </form>
      </Card>
    </Page>
  );
}
export function CreateStore() {
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const owners = useQuery({
    queryKey: ['store-owners'],
    queryFn: async () =>
      getData(await api.get('/admin/users', { params: { role: 'STORE_OWNER', limit: 100 } })),
  });
  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/stores', { ...form, ownerId: form.ownerId || null });
      setMessage('Store created successfully.');
      setForm({ name: '', email: '', address: '', ownerId: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create store');
    }
  }
  return (
    <Page title="Create store" subtitle="Add a store and optionally assign its owner">
      <Card className="max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Store name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Field
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Field
            label="Address"
            maxLength="400"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <label className="block text-sm font-semibold">
            Store owner (optional)
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5"
              value={form.ownerId}
              onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {(owners.data?.items || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {o.email}
                </option>
              ))}
            </select>
          </label>
          <ErrorText error={error ? { response: { data: { message: error } } } : null} />
          {message && <Notice>{message}</Notice>}
          <button className="rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">
            Create store
          </button>
        </form>
      </Card>
    </Page>
  );
}

export function UserStores() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ['stores', debounced, page, sortBy, sortOrder],
    queryFn: async () =>
      getData(
        await api.get('/stores', {
          params: { search: debounced, page, limit: 10, sortBy, sortOrder },
        })
      ),
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function save(store, rating, existing) {
    setError('');
    setNotice('');
    try {
      await api[existing ? 'put' : 'post'](`/stores/${store.id}/ratings`, { rating });
      setNotice('Your rating has been saved.');
      query.refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save rating');
    }
  }
  return (
    <Page title="Explore stores" subtitle="Find local businesses and share your experience">
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Field
          label="Search by store name or address"
          type="search"
          placeholder="Try “books” or a neighborhood"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Sort stores
            <select
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="address">Address</option>
              <option value="rating">Average rating</option>
            </select>
          </label>
          <button
            className="mt-2 text-sm font-semibold text-teal hover:underline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            aria-label="Toggle sort direction"
          >
            {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>
      </div>
      <ErrorText error={error ? { response: { data: { message: error } } } : null} />
      {notice && <Notice>{notice}</Notice>}
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorText error={query.error} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {query.data?.items.map((store) => (
              <Card key={store.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-ink">{store.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{store.address}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Stars value={store.averageRating || 0} label="Overall rating" />
                    {store.averageRating === null && (
                      <span className="text-xs text-slate-400">No ratings</span>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-600">Your rating</span>
                  <div className="flex items-center gap-3">
                    <Stars
                      value={store.userRating || 0}
                      onChange={(n) => save(store, n, store.userRating !== null)}
                      label={`Your rating for ${store.name}`}
                    />
                    {store.userRating !== null && (
                      <span className="text-xs text-slate-500">Edit rating</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {!query.data?.items.length && (
            <Card className="py-12 text-center text-sm text-slate-500">
              No stores found. Try another search.
            </Card>
          )}
          <div className="mt-4">
            <Pager
              page={query.data?.page || 1}
              pages={query.data?.totalPages || 0}
              setPage={setPage}
            />
          </div>
        </>
      )}
    </Page>
  );
}
export function OwnerDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: async () => getData(await api.get('/owner/dashboard')),
  });
  if (isLoading) return <Loading />;
  return (
    <Page title="Your store" subtitle="See how customers are rating your business">
      <ErrorText error={error} />
      {data?.store ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stats
              title="Average rating"
              value={data.averageRating === null ? 'N/A' : data.averageRating.toFixed(1)}
              hint="Across submitted ratings"
            />
            <Stats title="Total ratings" value={data.totalRatings} />
            <Card>
              <p className="text-sm font-semibold text-slate-500">Store</p>
              <p className="mt-2 font-bold text-ink">{data.store.name}</p>
              <p className="mt-1 text-sm text-slate-500">{data.store.email}</p>
            </Card>
          </div>
          <Card className="mt-4">
            <p className="text-sm text-slate-600">{data.store.address}</p>
          </Card>
        </>
      ) : (
        <Card>
          No store has been assigned to your account yet. Please contact an administrator.
        </Card>
      )}
    </Page>
  );
}
export function OwnerRatings() {
  const q = usePaged('/owner/ratings', 'owner-ratings');
  return (
    <Page title="Customer ratings" subtitle="Feedback submitted for your store">
      {q.isLoading ? (
        <Loading />
      ) : (
        <>
          <ErrorText error={q.error} />
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <SortHead
                  columns={[
                    ['Customer', 'name'],
                    ['Email', 'email'],
                    ['Address', 'address'],
                    ['Rating', 'rating'],
                    ['Date', 'createdAt'],
                  ]}
                  sortBy={q.sortBy}
                  sortOrder={q.sortOrder}
                  onSort={q.sort}
                />
                <tbody className="divide-y divide-slate-100">
                  {(q.data?.items || []).map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.user.name}</td>
                      <td className="px-4 py-3">{row.user.email}</td>
                      <td className="px-4 py-3">{row.user.address}</td>
                      <td className="px-4 py-3">
                        <Stars value={row.rating} />
                      </td>
                      <td className="px-4 py-3">{new Date(row.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!q.data?.items.length && (
                <p className="p-8 text-center text-sm text-slate-500">
                  No ratings have been submitted yet.
                </p>
              )}
            </div>
            <Pager page={q.data?.page || 1} pages={q.data?.totalPages || 0} setPage={q.setPage} />
          </Card>
        </>
      )}
    </Page>
  );
}
