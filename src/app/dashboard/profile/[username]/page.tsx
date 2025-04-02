import ProfileClient from "./components/profile-client";

// This is a server component that handles the dynamic params
export default function Page({ params }: { params: { username: string } }) {
  // Get username from params
  const { username } = params;

  // Pass the username to the client component
  return <ProfileClient username={username} />;
}
