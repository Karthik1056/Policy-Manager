"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { logout, type AuthUser } from "@/store/slices/authSlice";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Navbar({ user }: { user: AuthUser | null }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  const role = String(user?.role || "").toUpperCase();
  const isChecker = role === "CHECKER";
  const isAdmin = role === "ADMIN" || role === "IT_ADMIN";

  const menuItems = [
    { name: "Dashboard", href: "/dashboard" },
    ...(isChecker ? [{ name: "Approval Queue", href: "/dashboard/checker/queue" }] : []),
    ...(isAdmin ? [{ name: "Admin", href: "/dashboard/admin" }] : []),
    { name: "Versions", href: "/dashboard/versions" },
    { name: "Audit Log", href: "/dashboard/audit-log" },
    { name: "Simulation", href: "/dashboard/simulation" },
  ];

  return (
    <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-blue-600">Policy Management</h1>
        <NavigationMenu>
          <NavigationMenuList>
            {menuItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link href={item.href} className={navigationMenuTriggerStyle()} data-active={pathname === item.href}>
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          <Badge variant="secondary" className="text-xs">
            {role || "USER"}
          </Badge>
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <UserIcon size={16} />
        </div>
        <Button variant="ghost" size="icon" onClick={() => dispatch(logout())} title="Logout">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
