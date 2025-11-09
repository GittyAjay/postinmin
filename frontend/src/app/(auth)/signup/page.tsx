"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { endpoints, api } from "@/lib/api";
import { setSessionToken } from "@/lib/session";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  name: z.string().min(2, "Please share your name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await api.post(endpoints.auth.signup, values);
      return response.data as {
        user: { id: string; email: string; name?: string; role: "ADMIN" | "BUSINESS_OWNER"; planType?: "FREE" | "PRO" | "ENTERPRISE" };
        token: string;
      };
    },
    onSuccess: ({ user, token }) => {
      setSessionToken(token);
      setUser(user);
      toast.success("Account created — let’s build something emotional.");
      router.push("/dashboard");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to create account";
      toast.error(message);
    },
  });

  const onSubmit = async (values: FormValues) => {
    await mutateAsync(values);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create your account</h1>
        <p className="text-sm text-slate-500">
          Launch a brand-ready marketing studio powered by emotion-driven AI.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Alex Rivera" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@brand.com" type="email" autoComplete="email" {...field} />
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
                  <Input placeholder="••••••••" type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create account
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link className="font-medium text-blue-600 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}

