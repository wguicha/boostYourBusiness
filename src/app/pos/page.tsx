import POSClient from "@/components/POSClient/index";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// This page is now a simple wrapper. 
// All data fetching and logic is handled by the client component.
export default async function POSPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/auth/signin");
  }

  return <POSClient />;
}
