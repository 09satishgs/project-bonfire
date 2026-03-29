import { HomePage } from "@/components/home-page";

export default function Page() {
  return <HomePage adminEmail={process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@pogobonfire.com"} />;
}
