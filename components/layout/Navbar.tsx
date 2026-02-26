"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { logout, type AuthUser } from "@/store/slices/authSlice";
import { LogOut, User as UserIcon, LayoutDashboard, FilePlus, ClipboardList, Database, History, FileText, Play, GitBranch } from "lucide-react";

export default function Navbar({ user }: { user: AuthUser | null }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard" },
    ...(user?.role?.toLowerCase() === "checker" 
      ? [
          { name: "Approval Queue", href: "/dashboard/checker/queue" },
        ] 
      : []),
    { name: "Versions", href: "/dashboard/versions" },
    { name: "Audit Log", href: "/dashboard/audit-log" },
    { name: "Simulation", href: "/dashboard/simulation" },
  ];

  return (
    <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-blue-600"> Policy Management</h1>
        <nav className="flex items-center gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                pathname === item.href 
                  ? "text-blue-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <span className="text-xs text-gray-400">
          {user?.role?.toLowerCase() === "maker" ? "Maker" : "Checker"}
        </span>
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <UserIcon size={16} />
        </div>
        <button 
          onClick={() => dispatch(logout())}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
