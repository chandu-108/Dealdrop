import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const providerErrorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  if (providerError) {
    // Log provider-side error (e.g., user denied consent)
    console.error("OAuth provider error:", providerError, providerErrorDescription);
  }

  if (code) {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Auth callback: SUPABASE_SERVICE_ROLE_KEY present:', hasServiceKey);
    console.log('Auth callback: NEXT_PUBLIC_SUPABASE_ANON_KEY present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!hasServiceKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not set — code exchange will not succeed. Please add it to server env.');
      if (process.env.NODE_ENV !== "production") {
        const url = new URL("/error", request.url);
        url.searchParams.set("debug", "Missing SUPABASE_SERVICE_ROLE_KEY");
        return NextResponse.redirect(url);
      } else {
        return NextResponse.redirect(new URL("/error", request.url));
      }
    }

    const supabase = await createClient();
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }

      // Log exchange errors for debugging
      console.error("Failed to exchange code for session:", error);

      // In development include a short debug hint in the redirect so you can inspect it locally
      if (process.env.NODE_ENV !== "production" && error?.message) {
        const url = new URL("/error", request.url);
        url.searchParams.set("debug", error.message);
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error("Exception during exchangeCodeForSession:", err);
      if (process.env.NODE_ENV !== "production") {
        const url = new URL("/error", request.url);
        url.searchParams.set("debug", String(err?.message ?? err));
        return NextResponse.redirect(url);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL("/error", request.url));
}