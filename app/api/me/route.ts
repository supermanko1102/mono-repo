import { jsonOk } from "@/app/lib/http";
import { getCurrentUser } from "@/app/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  return jsonOk(user);
}
