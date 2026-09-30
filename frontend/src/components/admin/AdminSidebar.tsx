import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Heart,
  Server,
  LogOut,
  Globe,
  Camera,
  ShieldCheck,
} from "lucide-react";
import type { AdminUser } from "@/api/admin";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: "overview" | "weddings" | "system";
  onSelectTab: (tab: "overview" | "weddings" | "system") => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onBackHome: () => void;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  adminUser,
  onLogout,
  onBackHome,
  ...props
}: AdminSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Camera className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-tight">
                  Fotokita
                </span>
                <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3 text-primary inline" />
                  Super Admin
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Admin Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Kawalan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "overview"}
                  onClick={() => onSelectTab("overview")}
                  tooltip="Ringkasan Dashboard"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "weddings"}
                  onClick={() => onSelectTab("weddings")}
                  tooltip="Pengurusan Majlis"
                >
                  <Heart className="size-4" />
                  <span>Pengurusan Majlis</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "system"}
                  onClick={() => onSelectTab("system")}
                  tooltip="Status Servis"
                >
                  <Server className="size-4" />
                  <span>Status Sistem & Servis</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Links */}
        <SidebarGroup>
          <SidebarGroupLabel>Pautan Pantas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onBackHome} tooltip="Laman Awam Fotokita">
                  <Globe className="size-4" />
                  <span>Laman Utama Awam</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="size-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  SA
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight truncate">
                  <span className="truncate font-medium text-foreground">
                    {adminUser?.name || "Super Admin"}
                  </span>
                  <span className="truncate text-muted-foreground">
                    @{adminUser?.username || "superadmin"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Log Keluar"
                className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-background transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
