import { WishlistPage } from "@/components/wishlist-page";

export default function Page() {
  return (
    <WishlistPage adminEmail={process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""} />
  );
}
