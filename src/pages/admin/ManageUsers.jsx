// src/pages/admin/ManageUsers.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roles] = useState(["pending", "editor", "admin"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  async function updateRole(userId, role) {
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId);

    if (error) {
      console.error(error);
      alert("Error updating role: " + error.message);
    } else {
      fetchUsers();
    }
  }

  async function deleteUser(userId) {
    if (!window.confirm("Delete this user?")) return;

    // 1. Remove from users table
    const { error: tableErr } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (tableErr) {
      console.error(tableErr);
      return alert("Error deleting from users table: " + tableErr.message);
    }

    // 2. Remove from auth.users (optional, requires service role key in backend — not in frontend!)
    // For frontend-only, just remove from `users` table.

    fetchUsers();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>

      {loading ? (
        <p>Loading users…</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="p-3 border-b">Email</th>
                <th className="p-3 border-b">Role</th>
                <th className="p-3 border-b">Created At</th>
                <th className="p-3 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role || "pending"}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
