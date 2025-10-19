import { auth } from "@/lib/auth";
import { getApiBase } from "@/lib/env";
import type { BackendService } from "@/lib/api-client";

const ALLOWED_SERVICES: BackendService[] = ["visits", "clients", "notifications"];

async function proxyRequest(
  request: Request,
  params: { service: string; segments?: string[] }
): Promise<Response> {
  const session = await auth();
  if (!session?.access_token) {
    return new Response("No autorizado", { status: 401 });
  }

  const service = params.service as BackendService;
  if (!ALLOWED_SERVICES.includes(service)) {
    return new Response("Servicio no soportado", { status: 400 });
  }

  const base = getApiBase(service);
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const pathSegments = [params.service, ...(params.segments ?? [])].filter(Boolean);
  const tail = pathSegments.join("/");
  const target = new URL(tail, normalizedBase);

  const url = new URL(request.url);
  if (url.search) {
    target.search = url.search;
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${session.access_token}`);

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (!/^(GET|HEAD)$/i.test(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const backendResponse = await fetch(target, init);
  const responseHeaders = new Headers();
  const backendContentType = backendResponse.headers.get("content-type");
  if (backendContentType) {
    responseHeaders.set("Content-Type", backendContentType);
  }

  responseHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(await backendResponse.arrayBuffer(), {
    status: backendResponse.status,
    headers: responseHeaders
  });
}

export async function GET(request: Request, { params }: { params: { service: string; segments?: string[] } }) {
  return proxyRequest(request, params);
}

export async function POST(request: Request, { params }: { params: { service: string; segments?: string[] } }) {
  return proxyRequest(request, params);
}

export async function PUT(request: Request, { params }: { params: { service: string; segments?: string[] } }) {
  return proxyRequest(request, params);
}

export async function PATCH(request: Request, { params }: { params: { service: string; segments?: string[] } }) {
  return proxyRequest(request, params);
}

export async function DELETE(request: Request, { params }: { params: { service: string; segments?: string[] } }) {
  return proxyRequest(request, params);
}
