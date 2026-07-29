import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  return NextResponse.redirect(`${apiUrl}/auth/google/callback${url.search}`);
}
