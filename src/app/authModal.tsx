"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  getIdToken,
} from "firebase/auth";
import { auth } from "~/lib/firebaseConfigs/firebaseConfig";
import { setSessionCookie, clearSessionCookie } from "~/lib/auth";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";

// Form validation schema
const signUpSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleSignUp(values: z.infer<typeof signUpSchema>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );

      // Sign out immediately after creation to prevent abuse
      await auth.signOut();
      clearSessionCookie();

      await sendEmailVerification(userCredential.user);
      setIsVerifying(true);
      toast.success("Account created!", {
        position: "top-center",
        description: "Please check your email to verify your account",
      });
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Account already exists", {
          position: "top-center",
          description: "Please sign in instead",
        });
      } else {
        toast.error("Error creating account", {
          position: "top-center",
          description: error.message,
        });
      }
    }
  }

  async function handleSignIn(values: z.infer<typeof signInSchema>) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );

      if (!userCredential.user.emailVerified) {
        await auth.signOut(); // Sign out if not verified
        clearSessionCookie();

        toast.error("Email not verified", {
          position: "top-center",
          description: "Please check your email for the verification link",
        });
        return;
      }

      // set session cookie
      const token = await getIdToken(userCredential.user, true);
      await setSessionCookie(token);

      toast.success("Welcome back!", {
        position: "top-center",
      });
      onClose();
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage =
        "Sign in failed. Please check your credentials.";

      const errorMessages: Record<string, string> = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Invalid password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/invalid-email":
          "Invalid email address. Please check your email format.",
      };

      if (errorMessages[errorCode]) {
        errorMessage = errorMessages[errorCode];
      }
      toast.error("Sign in failed", {
        position: "top-center",
        description: errorMessage,
      });
    }
  }

  async function handleGoogleAuth() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // set session cookie
      const token = await getIdToken(result.user, true);
      await setSessionCookie(token);

      toast.success("Welcome!", {
        description: "Successfully signed in with Google",
      });
      onClose();
    } catch (error: any) {
      toast.error("Google Sign-in Error", {
        description: error.message,
      });
    }
  }

  if (isVerifying) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p>
              We've sent a verification email to {form.getValues("email")}.
              Please check your inbox and click the verification link.
            </p>
            <Button
              onClick={() => {
                setIsVerifying(false);
                onClose();
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Sign Up" : "Sign In"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={handleGoogleAuth}
            className="flex items-center gap-2"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Or continue with email
              </span>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                isSignUp ? handleSignUp : handleSignIn,
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email~example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
          </Form>

          <Button
            variant="ghost"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "No account? Sign Up"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
