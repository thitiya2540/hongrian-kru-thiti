import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type CurrentTeacher = {
  displayName: string;
  initial: string;
  role: "admin" | "teacher" | "viewer";
};

const fallbackTeacher: CurrentTeacher = { displayName: "คุณครู", initial: "ค", role: "teacher" };

export async function getCurrentTeacher(): Promise<CurrentTeacher> {
  if (!isSupabaseConfigured()) return fallbackTeacher;

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return fallbackTeacher;

    const { data } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", userData.user.id)
      .single();

    const displayName = data?.display_name?.trim() || fallbackTeacher.displayName;
    return {
      displayName,
      initial: displayName.slice(0, 1),
      role: data?.role ?? "teacher",
    };
  } catch {
    return fallbackTeacher;
  }
}
