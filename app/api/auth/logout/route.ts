import { jsonOk } from "@/app/lib/http";
import { clearSession } from "@/app/lib/session";

export async function POST() {
  await clearSession();
  return jsonOk(true);
}
