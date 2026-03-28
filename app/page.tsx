import { HomeShell } from "@/components/home-shell";

export default function Page() {
  return (
    <HomeShell
      adminEmail={process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@pogobonfire.com"}
      csvUrl={process.env.NEXT_PUBLIC_SHEET_CSV_URL}
    />
  );
}
