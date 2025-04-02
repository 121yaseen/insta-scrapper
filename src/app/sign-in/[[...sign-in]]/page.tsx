import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Sign In</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back to InstaScrapr
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
