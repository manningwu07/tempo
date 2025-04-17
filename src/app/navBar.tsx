// src/app/navBar.tsx
"use client";
import { useState } from "react";
import { signOut } from "firebase/auth";
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

export function NavbarAuth() {
  const user = useFirebaseUser();
  const [showModal, setShowModal] = useState(false);

  if (!user) {
    return (
      <>
        <Button
          onClick={() => setShowModal(true)}
          className="font-semibold"
        >
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
            <p className="text-sm font-medium leading-none">
              {user.displayName || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut(auth)}
          className="text-red-600 cursor-pointer"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
