"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileSearch, User, LogOut, FlaskConical, MessageSquare } from "lucide-react";

const navItems = [
  {
    title: "Chat",
    href: "/dashboard/chat",
    iconName: "MessageSquare",
  },
  {
    title: "CV Analyzer",
    href: "/dashboard/cv-analyzer",
    iconName: "FileSearch",
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    iconName: "User",
  },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileSearch: FileSearch,
  User: User,
  FlaskConical: FlaskConical,
  MessageSquare: MessageSquare,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName] = useState("Emily Nates");

  function handleLogout() {
    document.cookie = "admin_token=; path=/; max-age=0";
    document.cookie = "user_email=; path=/; max-age=0";
    document.cookie = "user_name=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between border-b p-4">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-primary">AskHR</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          <div className="h-4 w-4 border-2 border-primary rounded-sm" />
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = iconMap[item.iconName] || FileSearch;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">
                HR Administrator
              </p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="mt-3 w-full justify-start text-xs text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </aside>
  );
}
