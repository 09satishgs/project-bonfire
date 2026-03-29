import { SearchPage } from "@/components/search-page";

export default function Page() {
  return <SearchPage adminEmail={process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@pogobonfire.com"} />;
}
