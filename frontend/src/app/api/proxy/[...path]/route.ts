import { NextResponse, type NextRequest } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";

const ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";

const buildCorsHeaders = (origin?: string | null) => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin ?? "*");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  return headers;
};

export async function OPTIONS(request: NextRequest) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  return new NextResponse(null, { status: 204, headers });
}

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

const proxyRequest = async (request: NextRequest, context: RouteContext) => {
  const { path } = await context.params;
  const joinedPath = path?.join("/") ?? "";
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_API_URL.replace(/\/$/, "")}/${joinedPath}${search}`;

  const origin = request.headers.get("origin");
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") return;
    if (key.toLowerCase() === "host") return;
    headers.set(key, value);
  });
  headers.set("host", new URL(BACKEND_API_URL).host);

  let body: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await request.text();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const arrayBuffer = await request.arrayBuffer();
      body = arrayBuffer;
    } else {
      body = await request.text();
    }
  }

  const fetchOptions: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    body: body ?? undefined,
    redirect: "manual",
    credentials: "include",
    cache: "no-store",
  };
  if (body) {
    fetchOptions.duplex = "half";
  }

  const fetchResponse = await fetch(targetUrl, fetchOptions);

  const responseHeaders = buildCorsHeaders(origin);
  fetchResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") return;
    responseHeaders.set(key, value);
  });
  responseHeaders.delete("content-encoding");

  const response = new NextResponse(fetchResponse.body, {
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers: responseHeaders,
  });

  const setCookie = fetchResponse.headers.getSetCookie();
  if (setCookie.length) {
    response.headers.delete("Set-Cookie");
    setCookie.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  }

  return response;
};

