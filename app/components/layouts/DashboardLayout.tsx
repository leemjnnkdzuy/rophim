"use client";

import React from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { icon } from "@/app/assets";
import { useAuth } from "@/app/hooks/useAuth";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/app/components/ui/sidebar";
import {
	LayoutDashboard,
	Users,
	Film,
	MessageSquare,
	LogOut,
	ArrowLeft,
	User,
} from "lucide-react";

const sidebarNavItems = [
	{
		title: "Tổng quan",
		href: "/admin",
		icon: LayoutDashboard,
	},
	{
		title: "Thành viên",
		href: "/admin/members",
		icon: Users,
	},
	{
		title: "Phim",
		href: "/admin/films",
		icon: Film,
	},
	{
		title: "Bình luận",
		href: "/admin/comments",
		icon: MessageSquare,
	},
	{
		title: "Nội dung trang ",
		href: "/admin/content",
		icon: Film,
	}
];

function AppSidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const { user, logout } = useAuth();

	const currentPath =
		"/" +
		(pathname?.split("/").filter(Boolean).slice(0, 2).join("/") || "admin");

	return (
		<Sidebar collapsible='icon' className='border-r border-white/5'>
			<SidebarHeader className='border-b border-white/5'>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size='lg'
							onClick={() => router.push("/admin")}
							className='hover:bg-white/5'
						>
							<div className='flex aspect-square size-8 items-center justify-center rounded-lg'>
								<Image
									src={icon}
									alt='RapPhim Logo'
									width={32}
									height={32}
									className='rounded-lg'
								/>
							</div>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-bold text-white text-base'>
									RapPhim
								</span>
								<span className='truncate text-xs text-gray-400'>
									Trang quản lý
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className='text-gray-400 text-xs uppercase tracking-wider'>
						Quản lý
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{sidebarNavItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										isActive={currentPath === item.href}
										onClick={() => router.push(item.href)}
										tooltip={item.title}
										className={`transition-colors ${currentPath === item.href ?
												"bg-primary/10 text-primary font-medium"
												: "text-gray-300 hover:text-white hover:bg-white/5"
											}`}
									>
										<item.icon className='h-4 w-4' />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className='border-t border-white/5'>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => router.push("/")}
							tooltip='Về trang chủ'
							className='text-gray-300 hover:text-white hover:bg-white/5'
						>
							<ArrowLeft className='h-4 w-4' />
							<span>Về trang chủ</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => logout()}
							tooltip='Đăng xuất'
							className='text-gray-300 hover:text-red-400 hover:bg-red-500/10'
						>
							<LogOut className='h-4 w-4' />
							<span>Đăng xuất</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<div className='flex min-h-screen w-full bg-[#0d0d1a]'>
				<AppSidebar />
				<SidebarInset className='flex-1'>
					<main className='flex-1 p-4 md:p-6'>{children}</main>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
