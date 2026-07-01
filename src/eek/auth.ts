import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Session } from "./types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireSession(): Promise<Session> {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  // Load ASAS ERP organization and role context
  // Fallback to error if user not found in our DB
  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, user.email!),
  });

  if (!dbUser || !dbUser.organizationId) {
    throw new Error("UNAUTHORIZED_NO_ORG");
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      roleId: dbUser.roleId,
    },
    organizationId: dbUser.organizationId,
  };
}

export async function getOptionalSession(): Promise<Session | null> {
  try {
    return await requireSession();
  } catch {
    return null;
  }
}
