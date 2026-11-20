// =============================================================================
// apps/api/src/middleware.ts
// Edge-compatible middleware for Cloudflare Pages.
//
// Auth flow:
//   1. Frontend sends `Authorization: Bearer <clerk-jwt>` via apiFetch()
//   2. This middleware verifies the JWT using Clerk's verifyToken()
//   3. Extracts userId, orgId, orgRole, orgSlug from the JWT claims
//   4. Injects x-clerk-* headers so requireAuth() / requireOrgMember() can read them
//   5. For API keys (oa_*), the existing verifyApiKey flow is used instead
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@clerk/nextjs/server";
import { extractBearerToken, verifyApiKey } from "./lib/apiKeys";
import { withCors } from "./lib/cors";
import { initDb } from "./lib/db";

const PUBLIC_ROUTES = [
  /^\/api\/webhooks\//,
  /^\/api\/health$/,
  /^\/api\/ready$/,
  /^\/api\/v1\/ai\/health$/,
  /^\/api\/v1\/ai\/complete$/,
  /^\/api\/v1\/templates\/preview$/,
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((pattern) => pattern.test(pathname));
}

function corsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id, x-clerk-user-id, x-clerk-org-id, x-clerk-org-role, x-clerk-org-slug",
  };
}

function log(fields: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...fields }));
}

export default async function middleware(req: NextRequest) {
  const startMs = Date.now();
  const requestId = crypto.randomUUID();
  const pathname = req.nextUrl.pathname;

  try {
    try {
      await initDb();
    } catch (error) {
      console.warn("middleware: failed to initialize D1", error);
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...corsHeaders(req),
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ── Resolve auth from Authorization header ────────────────────────────
    const bearerToken = extractBearerToken(req.headers.get("authorization"));

    if (bearerToken) {
      if (bearerToken.startsWith("oa_")) {
        // API Key auth
        try {
          const apiKeyAuth = await verifyApiKey(bearerToken);
          requestHeaders.set("x-api-key-user-id", apiKeyAuth.userId);
          requestHeaders.set("x-api-key-org-id", apiKeyAuth.orgId);
          requestHeaders.set("x-auth-type", "api-key");
        } catch {
          return withCors(
            NextResponse.json(
              { success: false, error: { code: "UNAUTHORIZED", message: "Invalid API key", status: 401 } },
              { status: 401 }
            ),
            req.headers.get("origin") ?? undefined
          );
        }
      } else {
        // Clerk JWT auth — verify the token and inject x-clerk-* headers
        try {
          const secretKey = process.env.CLERK_SECRET_KEY;
          if (!secretKey) {
            console.error("[middleware] CLERK_SECRET_KEY is not set — cannot verify JWT");
          } else {
            const payload = await verifyToken(bearerToken, {
              secretKey,
            });
            console.log(
              "[JWT PAYLOAD]",
              JSON.stringify(payload, null, 2)
            );

            // Extract user info from JWT claims
            if (payload.sub) {
              requestHeaders.set("x-clerk-user-id", payload.sub);
            }

            // Extract org info from JWT claims (Clerk includes these when org is active)
            const orgData = (payload as Record<string, any>).o;

            const orgId = orgData?.id;
            const orgRole = orgData?.rol;
            const orgSlug = orgData?.slg;

            if (orgId) {
              requestHeaders.set("x-clerk-org-id", orgId);
            }
            if (orgRole) {
              requestHeaders.set("x-clerk-org-role", orgRole);
            }
            if (orgSlug) {
              requestHeaders.set("x-clerk-org-slug", orgSlug);
            }

            requestHeaders.set("x-auth-type", "clerk-jwt");

            log({
              requestId,
              auth: "clerk-jwt",
              userId: payload.sub,
              orgId: orgId ?? null,
            });
          }
        } catch (err) {
          // JWT verification failed — don't block the request for public routes,
          // but log the error. Protected routes will still 401 via requireAuth().
          console.warn("[middleware] Clerk JWT verification failed:", err instanceof Error ? err.message : err);
        }
      }
    }

    // ── Public routes — pass through (with auth headers if available) ──────
    if (isPublicRoute(pathname)) {
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.headers.set("x-request-id", requestId);
      for (const [key, value] of Object.entries(corsHeaders(req))) {
        response.headers.set(key, value);
      }
      log({ requestId, method: req.method, path: pathname, public: true, latencyMs: Date.now() - startMs });
      return response;
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    for (const [key, value] of Object.entries(corsHeaders(req))) {
      response.headers.set(key, value);
    }

    log({
      requestId,
      method: req.method,
      path: pathname,
      latencyMs: Date.now() - startMs,
    });

    return response;
  } catch (error) {
    console.error("[middleware] uncaught error", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Middleware failed", status: 500 } },
      { status: 500, headers: corsHeaders(req) }
    );
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
