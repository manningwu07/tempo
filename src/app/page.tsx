"use client";
import { Button } from "~/components/ui/button";
import {
  CalendarDays,
  ClipboardList,
  ArrowRight,
  Clock,
  Brain,
} from "lucide-react";
import { Navbar } from "./navBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <Navbar />
      </header>

      <main>
        {/* Hero Section - Now with animation */}
        <section className="relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
          
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  <span className="block text-primary">Supercharge</span>
                  Your Productivity Journey
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Stop juggling between apps. Tempo brings your calendar, notes, and goals
                  into one seamless workspace. Built for professionals who value their time.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Button
                    size="lg"
                    className="group relative overflow-hidden rounded-full px-8 py-3 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 transition-all hover:bg-gray-100"
                  >
                    See Features
                  </Button>
                </div>
                
                {/* Social Proof */}
                <div className="mt-12 flex items-center gap-8">
                  <p className="text-sm font-medium text-gray-500">Trusted by people at</p>
                  {/* Add some fake company logos */}
                </div>
              </div>
              
              {/* Hero Image/Animation */}
              <div className="relative rounded-xl border bg-white p-4 shadow-2xl">
                {/* Add your app screenshot or animation here */}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to stay on track
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                Powerful features that adapt to your workflow
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: CalendarDays,
                  title: "Smart Calendar",
                  description:
                    "AI-powered scheduling that learns from your preferences and habits",
                },
                {
                  icon: ClipboardList,
                  title: "Connected Notes",
                  description:
                    "Context-aware notes that automatically link to your calendar events",
                },
                {
                  icon: Clock,
                  title: "Time Analytics",
                  description:
                    "Deep insights into how you spend your time, with actionable recommendations",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

{/*  Testimonial Section and Pricing Section       
        <section className="bg-gray-900 py-24 text-white">
          
        </section>

        <section className="py-24">

        </section> */}

        <section className="relative overflow-hidden bg-primary py-32 text-white">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
          
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold">Start your productivity journey</h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-white/80">
              Join thousands of professionals who have already transformed their workflow
              with Tempo.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full bg-white px-8 text-primary hover:bg-white/90"
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with better layout */}
      <footer className="border-t bg-white">
        {/* Add more footer content */}
      </footer>
    </div>
  );
}
// Sell page to convince nubs to sign up