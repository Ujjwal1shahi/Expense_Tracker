import React from "react";
import { useState, useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useStore from "../../store";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "../../components/ui/card";

const RegisterSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" }),
  firstName: z.string({ required_error: "Name is requried" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

const Signup = () => {
  const { user } = useStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState();

  useEffect(() => {
    user && navigate("/");
  }, [user]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4">
      {/* Background Blobs */}
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

      <Card className="relative w-full max-w-5xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">

  <div className="grid md:grid-cols-2">

    {/* LEFT SIDE - FORM */}
    <div className="p-8 md:p-10">

      <CardHeader className="p-0">
        <CardTitle className="text-center text-3xl font-bold text-white">
          Create Account
        </CardTitle>

        <p className="mt-2 text-center text-sm text-slate-400">
          Start tracking your expenses smarter.
        </p>
      </CardHeader>

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit((data) => {
          console.log(data);
        })}
      >

        {/* Name */}
        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Full Name
          </label>

          <input
            type="text"
            placeholder="John Doe"
            {...register("firstName")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />

          {errors?.firstName && (
            <p className="mt-1 text-sm text-red-400">
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Email
          </label>

          <input
            type="email"
            placeholder="john@example.com"
            {...register("email")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />

          {errors?.email && (
            <p className="mt-1 text-sm text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Password
          </label>

          <input
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />

          {errors?.password && (
            <p className="mt-1 text-sm text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div className="text-center text-sm text-slate-400">
          Already have an account?

          <button
            type="button"
            onClick={() => navigate("/sign-in")}
            className="ml-2 text-blue-400 hover:text-blue-300"
          >
            Sign In
          </button>
        </div>

      </form>
    </div>

    {/* RIGHT SIDE IMAGE */}
    <div className="relative hidden md:flex items-center justify-center overflow-hidden bg-gradient-to-br">

      {/* Glow */}
      <div className="absolute h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      {/* Image */}
      <img
        src="https://www.wellybox.com/wp-content/uploads/2021/01/6-business-expense-tracker-1024x1024.jpg"
        alt="Signup"
        className="relative z-10 w-full rounded-l-full object-contain drop-shadow-2xl"
      />

      {/* Text Overlay */}
      <div className="absolute bottom-6 left-10 right-10 z-10">
        <h2 className="text-3xl font-bold text-white">
          Manage Your Money
        </h2>

        <p className="mt-3 text-white">
          Track expenses, analyze spending habits,
          and stay on top of your finances.
        </p>
      </div>

    </div>

  </div>
</Card>
    </div>
  );
};

export default Signup;
