import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/pistah.svg"
              alt="Pistah Logo"
              width={140}
              height={50}
              priority
            />
          </div>
          <h1 className="text-4xl font-bold mb-2">Sign Up</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account to access Pistah
          </p>
        </div>
        <SignUp redirectUrl="/dashboard" />
      </div>
    </div>
  );
}
