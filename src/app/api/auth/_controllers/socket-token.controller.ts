import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiError } from "@/app/api/_shared/error-response";

export async function handleSocketToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return apiError(401, "AUTH_SESSION_INVALID");
  }

  return NextResponse.json(
    {
      status: 200,
      data: { token },
    },
    { status: 200 },
  );
}
