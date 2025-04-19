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
import { Brain, CalendarDays, CheckCircle } from "lucide-react";
import { clearSessionCookie } from "~/lib/auth";
import { useGoalsView } from "~/context/goalsViewContext";

export function Navbar() {
  const user = useFirebaseUser();
  const { view } = useGoalsView();

  return (
    <header className="border-b">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-gray-900" />
          <span className="text-xl font-semibold">Tempo</span>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Toggle />
          ) : (
            <>
              <Button variant="ghost">Features</Button>
              <Button variant="ghost">Pricing</Button>
            </>
          )}
          <NavbarAuth user={user} />
        </div>
      </nav>
    </header>
  );
}

function NavbarAuth({ user }: { user: Auth["currentUser"] }) {
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
          onClick={() =>
            signOutTempo(auth).then(() => window.location.reload())
          }
          className="cursor-pointer text-red-600"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function signOutTempo(auth: Auth) {
  await clearSessionCookie();
  signOut(auth);
}

function Toggle() {
  const { view, setView } = useGoalsView();

  return (
    <div className="isolate inline-flex rounded-md shadow-sm">
      <Button
        type="button"
        className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${
          view === "short"
            ? "bg-blue-100 text-blue-800"
            : "bg-white text-gray-900 hover:bg-gray-50"
        }`}
        onClick={() => setView("short")}
        variant="ghost" 
      >
        <CalendarDays className="h-7 w-7" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${
          view === "long"
            ? "bg-blue-100 text-blue-800"
            : "bg-white text-gray-900 hover:bg-gray-50"
        }`}
        onClick={() => setView("long")}
        variant="ghost" 
      >
        <CheckCircle className="h-7 w-7" aria-hidden="true" />
      </Button>
    </div>
  );
}