export default function AdminHome() {
  return (
    <main style={{ padding: 24 }}>
      <h1>SoCalMedic Admin CMS</h1>
      <p>Phase 1 UI — connect to <code>/api/admin/v1/*</code> on the API server.</p>
      <ul>
        <li>Super admin: all apps</li>
        <li>App admin: scoped to one app_id</li>
      </ul>
      <p>API admin login: <code>POST /api/admin/v1/auth/login</code></p>
    </main>
  );
}
