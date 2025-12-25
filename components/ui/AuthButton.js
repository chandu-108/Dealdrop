"use client";

import { useState } from "react";
import { signOut } from "@/app/actions";
import AuthModal from "./AuthModal";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AuthButton({ user }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const result = await signOut();
    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(result?.message || "Signed out");
    router.push("/");
  };

  if (user) {
    return (
      <Button onClick={handleSignOut} variant="ghost" size="sm" className="gap-2">
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowAuthModal(true)}
        variant="default"
        size="sm"
        className="bg-orange-500 hover:bg-orange-600 gap-2 cursor-pointer"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}