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
  ShieldCheck,
  UserPlus,
  MessageSquare,
  Ticket,
} from "lucide-react";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";
import type { AdminUser } from "@/api/admin";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: "overview" | "inquiries" | "vouchers" | "invites" | "weddings" | "system";
  onSelectTab: (tab: "overview" | "inquiries" | "vouchers" | "invites" | "weddings" | "system") => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onBackHome: () => void;
  pendingInquiriesCount?: number;
  activeVouchersCount?: number;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  adminUser,
  onLogout,
  onBackHome,
  pendingInquiriesCount = 0,
  activeVouchersCount = 0,
  ...props
}: AdminSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <FotokitaLogo variant="mark" size="md" className="shrink-0" />
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
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "overview"}
                  onClick={() => onSelectTab("overview")}
                  tooltip="Dashboard Overview"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "inquiries"}
                  onClick={() => onSelectTab("inquiries")}
                  tooltip="Customer Inquiries"
                >
                  <MessageSquare className="size-4" />
                  <span className="flex-1">Inquiries</span>
                  {typeof pendingInquiriesCount === "number" && pendingInquiriesCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/20 px-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {pendingInquiriesCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "vouchers"}
                  onClick={() => onSelectTab("vouchers")}
                  tooltip="Vouchers & Promo Codes"
                >
                  <Ticket className="size-4" />
                  <span className="flex-1">Vouchers & Deals</span>
                  {typeof activeVouchersCount === "number" && activeVouchersCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-500/20 px-1.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                      {activeVouchersCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "invites"}
                  onClick={() => onSelectTab("invites")}
                  tooltip="Tenant Invites (24h Single-Use)"
                >
                  <UserPlus className="size-4" />
                  <span>Tenant Invites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "weddings"}
                  onClick={() => onSelectTab("weddings")}
                  tooltip="Weddings Management"
                >
                  <Heart className="size-4" />
                  <span>Weddings Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "system"}
                  onClick={() => onSelectTab("system")}
                  tooltip="System & Services"
                >
                  <Server className="size-4" />
                  <span>System & Services</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Links */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onBackHome} tooltip="Public Home Page">
                  <Globe className="size-4" />
                  <span>Public Home Page</span>
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
                title="Sign out"
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
