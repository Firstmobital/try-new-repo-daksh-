// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState("editor");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin-login");
      return;
    }

    const { data, error } = await supabase
      .from("permissions")
      .select("module,level")
      .eq("email", user.email);

    if (error) {
      console.error(error);
      return;
    }

    const roleRow = data.find((d) => d.module === "role");
    setRole(roleRow?.level || "editor");
    setPermissions(data.filter((d) => d.module !== "role" && d.level === "editor").map((d) => d.module));
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/admin-login");
  }

  const allModules = [
    { key: "accessories", label: "Accessories" },
    { key: "cars", label: "Cars" },
    { key: "insurance", label: "Insurance" },
    { key: "rto", label: "RTO" },
    { key: "schemes", label: "Schemes" },
    { key: "variant-content", label: "Variant Content" },
    { key: "variants", label: "Variants" },
    { key: "permissions", label: "Permissions" },
  ];

  const visibleModules =
    role === "admin"
      ? allModules
      : allModules.filter((m) => permissions.includes(m.key));

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {visibleModules.map((m) => (
            <Link
              key={m.key}
              to={`/admin/${m.key}`}
              className="block hover:bg-gray-700 px-3 py-2 rounded"
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            ← Back to Site
          </button>
          <button
            onClick={signOut}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
