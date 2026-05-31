import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function RootPage() {
  // Backup redirect in case middleware doesn't intercept (e.g. static export/fallback)
  redirect(ROUTES.welcome);
}
