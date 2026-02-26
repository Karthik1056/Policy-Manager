"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePlus, ClipboardList, Database, History } from "lucide-react";

export default function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    ...(userRole?.toLowerCase() === "maker" 
      ? [
          { name: "My Policies", href: "/dashboard/maker", icon: <Database size={18} /> },
          { name: "Create Policy", href: "/dashboard/maker/create", icon: <FilePlus size={18} /> },
        ] 
      : []),
    ...(userRole?.toLowerCase() === "checker" 
      ? [
          { name: "Approval Queue", href: "/dashboard/checker/queue", icon: <ClipboardList size={18} /> },
        ] 
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r flex flex-col h-full shadow-sm">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">PolicyEngine</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              pathname === item.href 
                ? "bg-blue-50 text-blue-600 border border-blue-100" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-gray-400">
           Role: <span className="font-bold text-gray-700">{userRole}</span>
        </div>
      </div>
    </aside>
  );
}
