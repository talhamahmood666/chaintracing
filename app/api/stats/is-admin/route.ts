import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-helpers";
import { isAdminById } from "@/lib/auth-admin";

export async function GET(request: NextRequest) {
  const { user } = await getUser(request);
  if (!user) return NextResponse.json({ admin: false });
  const admin = await isAdminById(user.id);
  return NextResponse.json({ admin });
}
