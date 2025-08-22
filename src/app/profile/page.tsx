import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import UserProfileForm from "@/components/UserProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/auth/signin"); // User not found in DB, redirect to signin
  }

  // Convert Date objects to string for client component serialization
  const serializableUser = {
    ...user,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null, // Handle nullable updatedAt
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
      <UserProfileForm user={serializableUser} />
    </div>
  );
}

