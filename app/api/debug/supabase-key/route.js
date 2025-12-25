import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Temporary, server-only debug endpoint to validate SUPABASE_SERVICE_ROLE_KEY.
// Usage (only in production if you set the secret):
// curl -H "x-debug-secret: <CRON_SECRET>" https://your-site.vercel.app/api/debug/supabase-key

export async function GET(request) {
  const secretHeader = request.headers.get("x-debug-secret") || "";
  const secret = process.env.CRON_SECRET;

  if (!secret || secretHeader !== secret) {
    console.warn("Supabase key check: missing or invalid debug secret header");
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = await createClient();

    // Try admin endpoint first (requires service role key)
    let adminOk = false;
    let adminResultSummary = null;

    try {
      if (supabase?.auth?.admin?.listUsers) {
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) {
          console.error("Supabase admin.listUsers returned error", {
            message: error.message,
            status: error.status,
            code: error.code,
          });
          adminOk = false;
          adminResultSummary = { error: error.message };
        } else {
          adminOk = true;
          adminResultSummary = { sampleUsers: Array.isArray(data) ? data.length : null };
        }
      } else {
        // Fallback: try a simple read query to check basic connectivity
        const { data, error } = await supabase.from("products").select("id").limit(1);
        if (error) {
          adminOk = false;
          adminResultSummary = { error: error.message };
        } else {
          adminOk = true;
          adminResultSummary = { sampleProducts: Array.isArray(data) ? data.length : null };
        }
      }
    } catch (err) {
      console.error("Exception performing supabase check:", {
        message: err?.message ?? String(err),
        name: err?.name,
      });
      adminOk = false;
      adminResultSummary = { exception: String(err?.message ?? err) };
    }

    // Masked key suffix for quick confirmation (no full keys are printed)
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const maskedSuffix = svcKey ? `*****${svcKey.slice(-6)}` : null;

    console.log("Supabase key check result:", { hasServiceKey, hasAnonKey, adminOk, maskedSuffix, adminResultSummary });

    return NextResponse.json({ ok: adminOk, hasServiceKey, hasAnonKey, maskedSuffix, adminResultSummary });
  } catch (err) {
    console.error("Unexpected error in supabase key check", err);
    return NextResponse.json({ ok: false, message: "Unexpected error" }, { status: 500 });
  }
}
