import { NextResponse } from "next/server";
import { CATALOGO } from "@/lib/catalogo";

export async function GET() {
  return NextResponse.json(CATALOGO);
}
