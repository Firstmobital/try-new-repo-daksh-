// src/pages/AdminLogin.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate("/admin");
    });
  }, [navigate]);

  const signIn = async (e) => {
    e.preventDefault();
    setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setErr(error.message);

    const user = data.user;
    if (user) {
      // insert into users table if not exists
      await supabase
        .from("users")
        .upsert({ id: user.id, email: user.email }, { onConflict: "id" });
    }

    navigate("/admin");
  };

  const signUp = async (e) => {
    e.preventDefault();
    setErr("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setErr(error.message);

    const user = data.user;
    if (user) {
      await supabase
        .from("users")
        .upsert({ id: user.id, email: user.email }, { onConflict: "id" });
    }

    alert("Signed up! Ask admin to grant your access. You can now log in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="card p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Admin Sign In</h1>

        {/* Tabs for Sign In / Sign Up */}
        <div className="flex mb-4">
          <button
            className="flex-1 py-2 border-b-2 border-blue-600 font-semibold"
            type="button"
            onClick={() => setErr("")}
          >
            Sign In
          </button>
          <button
            className="flex-1 py-2 border-b-2 border-gray-200"
            type="button"
            onClick={() => setErr("")}
          >
            Sign Up
          </button>
        </div>

        {/* Sign In Form */}
        <form className="space-y-3" onSubmit={signIn}>
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <button className="btn btn-primary w-full" type="submit">
            Sign In
          </button>
          <button className="btn btn-outline w-full" onClick={signUp}>
            Sign Up
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-3">
          New signups get <b>view-only</b> role until an admin approves.
        </p>
      </div>
    </div>
  );
}
