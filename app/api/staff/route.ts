import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    // 1. Verify Request comes from an Owner
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (ownerProfile?.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can add staff" },
        { status: 403 }
      );
    }

    const { email, password, name } = await request.json();
    let staffUserId = "";

    // 2. Try to Create the User
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

    if (authError) {
      // HANDLE "EMAIL EXISTS" ERROR
      if (authError.message.includes("already been registered")) {
        console.log("User exists, checking for missing profile...");

        // Fetch the existing user's ID
        const { data: existingUser } =
          await supabaseAdmin.auth.admin.listUsers();
        const foundUser = existingUser.users.find((u) => u.email === email);

        if (!foundUser) throw new Error("Could not verify existing user.");

        // Check if they already have a profile
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", foundUser.id)
          .single();

        if (existingProfile) {
          return NextResponse.json(
            { error: "Staff member already exists in the system." },
            { status: 400 }
          );
        }

        // If no profile, we will "adopt" this user ID and create the profile below
        staffUserId = foundUser.id;
      } else {
        throw authError; // Some other error
      }
    } else {
      // New user created successfully
      if (!authData.user) throw new Error("Failed to create user");
      staffUserId = authData.user.id;
    }

    // 3. Create/Fix the Staff Profile
    // We use upsert to be safe, linking it to the Owner's Store ID
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: staffUserId,
        store_id: ownerProfile.store_id,
        full_name: name,
        role: "staff",
      });

    if (profileError) throw profileError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Add Staff Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
