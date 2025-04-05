import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Pistah",
  description:
    "Create an account to access Pistah's influencer discovery tools",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
