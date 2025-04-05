import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History | Pistah",
  description: "View your search history of Instagram influencers",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
