"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

import api from "@/lib/api";
import { setCredentials, type AuthUser } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MAKER", "CHECKER", "ADMIN", "IT_ADMIN"], {
    message: "Please select a valid role",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Something went wrong";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
};

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "MAKER",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const loadingToast = toast.loading("Verifying credentials...");
    try {
      const response = await api.post("/users/login", data);

      const body = response.data as unknown;
      const payload = (body && typeof body === "object" && "data" in body ? (body as { data: unknown }).data : body) as unknown;
      const user =
        (payload as { user?: AuthUser; returnUser?: AuthUser }).user ??
        (payload as { user?: AuthUser; returnUser?: AuthUser }).returnUser;
      const accessToken = (payload as { accessToken?: string }).accessToken;
      if (!user || !accessToken) {
        throw new Error("Unexpected login response from server");
      }
      dispatch(
        setCredentials({
          user,
          token: accessToken,
        })
      );

      toast.success("Login successful!", { id: loadingToast });

      // Clear all toasts before navigation
      setTimeout(() => {
        toast.dismiss();
      }, 1000);

      const normalizedRole = String(user.role || "").toUpperCase();
      if (normalizedRole === "CHECKER") {
        router.push("/dashboard/checker/queue");
      } else if (["ADMIN", "IT_ADMIN"].includes(normalizedRole)) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-200">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Policy Engine
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your credit policy dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="karthik@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="********"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Login As
              </label>
              <select
                {...register("role")}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="MAKER">Maker (Editor)</option>
                <option value="CHECKER">Checker (Reviewer)</option>
                <option value="ADMIN">Admin</option>
                <option value="IT_ADMIN">IT Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
