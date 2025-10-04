// src/pages/admin/ManagePermissions.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const modules = [
  "accessories",
  "cars",
  "insurance",
  "rto",
  "schemes",
  "variant-content",
  "variants",
  "permissions",
];

export default function ManagePermissions() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [savingEmail, setSavingEmail] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: perms, error } = await supabase
      .from("permissions")
      .select("email,module,level");

    if (error) {
      console.error("Load error:", error.message);
      return;
    }

    const grouped = perms.reduce((acc, row) => {
      if (!acc[row.email]) acc[row.email] = { email: row.email, role: "editor", allowed: [] };
      if (row.module === "role") {
        acc[row.email].role = row.level; // 'admin' or 'editor'
      } else if (row.level === "editor") {
        acc[row.email].allowed.push(row.module);
      }
      return acc;
    }, {});

    setUsers(Object.values(grouped));
  }

  function toggleModule(userEmail, module) {
    setUsers((prev) =>
      prev.map((u) =>
        u.email === userEmail
          ? {
              ...u,
              allowed: u.allowed.includes(module)
                ? u.allowed.filter((m) => m !== module)
                : [...u.allowed, module],
            }
          : u
      )
    );
  }

  function changeRole(userEmail, role) {
    setUsers((prev) =>
      prev.map((u) => (u.email === userEmail ? { ...u, role } : u))
    );
  }

  async function saveUser(user) {
    setSavingEmail(user.email);

    // Always set a role row
    const rows = [
      { email: user.email, module: "role", level: user.role },
    ];

    if (user.role === "editor") {
      // Only save per-module rows for editor
      for (const m of modules) {
        rows.push({
          email: user.email,
          module: m,
          level: user.allowed.includes(m) ? "editor" : "hide",
        });
      }
    }

    const { error } = await supabase
      .from("permissions")
      .upsert(rows, { onConflict: "email,module" });

    if (error) {
      console.error("Save error:", error.message);
      alert("Save failed: " + error.message);
    } else {
      alert("Permissions saved for " + user.email);
    }

    setSavingEmail("");
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Users & Permissions</h1>

      {/* Search */}
      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Search email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="space-y-4">
        {users
          .filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
          .map((u) => (
            <div
              key={u.email}
              className="flex items-center justify-between border rounded-lg p-4 bg-white shadow-sm"
            >
              {/* Email + role */}
              <div className="flex-1">
                <div className="font-medium">{u.email}</div>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.email, e.target.value)}
                  className="mt-1 border rounded px-2 py-1 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </select>
              </div>

              {/* Allowed modules (only if editor) */}
              {u.role === "editor" && (
                <div className="flex flex-wrap gap-2 flex-1 justify-center">
                  {modules.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleModule(u.email, m)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.allowed.includes(m)
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {/* Save button */}
              <div className="flex-1 text-right">
                <button
                  onClick={() => saveUser(u)}
                  disabled={savingEmail === u.email}
                  className={`px-4 py-2 rounded text-sm ${
                    savingEmail === u.email
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {savingEmail === u.email ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
