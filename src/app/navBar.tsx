"use client";
import { useState } from "react";
import { signOut, type Auth } from "firebase/auth";
import { auth } from "../lib/firebaseConfigs/firebaseConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import AuthModal from "./authModal";

import useFirebaseUser from "~/hooks/useFirebaseUser";
import { Brain } from "lucide-react";
import { clearSessionCookie } from "~/lib/auth";

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-gray-900" />
          <span className="text-xl font-semibold">Tempo</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost">Features</Button>
          <Button variant="ghost">Pricing</Button>
          <NavbarAuth />
        </div>
      </nav>
    </header>
  );
}

function NavbarAuth() {
  const user = useFirebaseUser();
  const [showModal, setShowModal] = useState(false);

  if (!user) {
    return (
      <>
        <Button onClick={() => setShowModal(true)} className="font-semibold">
          Sign In
        </Button>
        <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                user.photoURL ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`
              }
              alt="Profile"
            />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {user.displayName || "User"}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOutTempo(auth).then(() => window.location.reload())}
          className="cursor-pointer text-red-600"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


async function signOutTempo(auth: Auth){
  await clearSessionCookie();
  signOut(auth);

}