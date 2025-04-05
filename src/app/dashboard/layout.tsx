import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Pistah",
  description: "Find and analyze Instagram influencers with Pistah",
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
