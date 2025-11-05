// /api/schema.js
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Create a Supabase client using environment variables.
 * These must be set in Vercel:
 * PUBLIC_SUPABASE_URL
 * PUBLIC_SUPABASE_ANON_KEY
 */
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

/**
 * ✅ API Route (Vercel Serverless Function)
 * Returns a grouped JSON structure of all tables + columns
 */
export default async function handler(req, res) {
  try {
    // Query Supabase system schema for all public tables
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("table_name, column_name, data_type")
      .eq("table_schema", "public")
      // Optional: skip internal Supabase system tables
      .not("table_name", "in", "(migrations, storage.objects, storage.buckets)")
      .order("table_name", { ascending: true });

    if (error) throw error;

    // Group by table name for cleaner JSON
    const grouped = data.reduce((acc, col) => {
      if (!acc[col.table_name]) acc[col.table_name] = [];
      acc[col.table_name].push({
        column: col.column_name,
        type: col.data_type,
      });
      return acc;
    }, {});

    // Send structured response
    res.status(200).json({
      status: "success",
      total_tables: Object.keys(grouped).length,
      schema: grouped,
    });
  } catch (err) {
    console.error("Schema API error:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Unknown error",
    });
  }
}
