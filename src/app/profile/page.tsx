
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import UserProfileForm from "@/components/UserProfileForm/index";

export default async function ProfilePage() {
  const session = await auth();

  if (!session || !session.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businesses: {
        include: {
          business: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/signin"); // User not found in DB, redirect to signin
  }

  // Convert Date objects to string for client component serialization
  const serializableUser = {
    ...user,
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
    businessName: user.businesses[0]?.business.name || null, // Add businessName
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
      <UserProfileForm user={serializableUser} />
    </div>
  );
}

