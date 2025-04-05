import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Pistah",
  description: "Sign in to access Pistah's influencer discovery tools",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
