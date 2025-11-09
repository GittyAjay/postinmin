"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRightIcon, CalendarDays, LineChart, MessageCircle, Palette, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "Emotion-aware calendar",
    description: "Generate 30-day content plans aligned to the feelings your audience craves.",
    icon: CalendarDays,
  },
  {
    title: "Visual template designer",
    description: "Drag, drop, and adapt placeholders in a live canvas powered by Fabric.js.",
    icon: Palette,
  },
  {
    title: "Brand voice intelligence",
    description: "Embed DeepSeek tone into every caption so you stay unmistakably on-brand.",
    icon: MessageCircle,
  },
  {
    title: "Realtime analytics",
    description: "Monitor uplift by emotion, template, and platform from one glassmorphic dashboard.",
    icon: LineChart,
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-20 h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <header className="relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">AI</div>
            <span className="tracking-tight text-slate-800 dark:text-slate-200">postinmin</span>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Pricing
            </Link>
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login" className="text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400">
                Login
              </Link>
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-24 text-center md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.12)] dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300 dark:shadow-[0_2px_14px_rgba(56,189,248,0.18)]"
          >
            <SparklesIcon className="h-4 w-4" />
            Emotionally intelligent marketing automation
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-6xl"
          >
            Your AI Marketing Studio — Smart. Emotionally Engaging. Automated.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-lg text-slate-600 dark:text-slate-300 md:text-xl"
          >
            Generate content calendars, design branded templates, and track emotional performance — all inside a single creative hub designed for modern teams.
          </motion.p>
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <Button
              size="lg"
              className="rounded-full bg-blue-600 px-8 text-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
              asChild
            >
              <Link href="/signup">Start free trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-blue-200 px-8 text-lg text-blue-600 dark:border-blue-400/40 dark:text-blue-300"
              asChild
            >
              <Link href="/dashboard" className="dark:text-blue-300">
                Explore dashboard
              </Link>
            </Button>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
          <motion.div
            className="grid gap-6 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.12,
                },
              },
            }}
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Card className="border-slate-200 shadow-lg shadow-blue-100/30 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:shadow-blue-900/30">
                  <CardContent className="space-y-4 p-6 text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <Icon className="h-6 w-6" strokeWidth={2.4} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
            })}
          </motion.div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 pb-24">
          <motion.div
            className="grid gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.15 },
              },
            }}
          >
            {[
              {
                name: "Free",
                price: "$0",
                description: "10 AI posts per month. Perfect for testing the waters.",
                cta: "Get Started",
              },
              {
                name: "Pro",
                price: "$49",
                description: "100 AI posts + image renders. Built for growing brands.",
                cta: "Upgrade to Pro",
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Unlimited generation, analytics API, dedicated support.",
                cta: "Talk to us",
              },
            ].map((plan) => (
              <motion.div
                key={plan.name}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Card
                  className={`relative overflow-hidden border-slate-200 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 ${plan.highlighted ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white" : "bg-white dark:bg-slate-900"}`}
                >
                  {plan.highlighted ? (
                    <div className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      Most popular
                    </div>
                  ) : null}
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                      <p className={`text-sm font-semibold ${plan.highlighted ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                        {plan.name}
                      </p>
                      <p className={`text-3xl font-bold ${plan.highlighted ? "text-white" : "text-slate-900 dark:text-white"}`}>
                        {plan.price}
                      </p>
                    </div>
                    <p className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-slate-600 dark:text-slate-300"}`}>{plan.description}</p>
                    <Button
                      variant={plan.highlighted ? "secondary" : "default"}
                      className={`w-full rounded-full ${plan.highlighted ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"}`}
                      asChild
                    >
                      <Link href="/signup">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <footer className="relative border-t border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-slate-500 dark:text-slate-400 md:flex-row">
          <span>© {new Date().getFullYear()} postinmin. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-blue-600 dark:hover:text-blue-400">
              Docs
            </Link>
            <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
