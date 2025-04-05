import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover | Pistah",
  description: "Discover popular Instagram influencers and creators",
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
