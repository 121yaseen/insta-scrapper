"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold">
              InstaScrapr
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/history"
                className="hover:text-blue-600 transition-colors"
              >
                History
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {title && <h1 className="text-3xl font-bold mb-8">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
