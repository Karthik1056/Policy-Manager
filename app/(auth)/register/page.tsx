"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { AxiosError } from "axios";
import api from "@/lib/api";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["MAKER", "CHECKER"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Registration failed";
  }
  if (error instanceof Error) return error.message;
  return "Registration failed";
};

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "MAKER" }
  });

  const onSubmit = async (data: SignupFormValues) => {
    const loadingToast = toast.loading("Creating your account...");
    try {
      // Don't send confirmPassword to the backend
      const submitData = {
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
      };
      
      await api.post("/users/signup", submitData);
      
      toast.success("Account created! Please login.", { id: loadingToast });
      router.push("/login");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join the Policy Engine platform</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                {...register("name")}
                className={`mt-1 block w-full px-3 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Karthik Adiga"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                {...register("email")}
                type="email"
                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="karthik@example.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                {...register("role")}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="MAKER">Maker (Editor)</option>
                <option value="CHECKER">Checker (Reviewer)</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                {...register("password")}
                type="password"
                className={`mt-1 block w-full px-3 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
                className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
