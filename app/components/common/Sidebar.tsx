"use client";

import React from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {icon} from "@/app/assets";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetTitle,
} from "@/app/components/ui/sheet";
import {
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubItem,
	SidebarMenuSubButton,
	SidebarInput,
	SidebarSeparator,
} from "@/app/components/ui/sidebar";
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/app/components/ui/collapsible";
import {cn} from "@/app/utils/utils";
import {
	Search,
	ChevronRight,
	Menu,
	User,
	Bookmark,
	History,
	Film,
	Tv,
	Users,
	Flame,
	LayoutDashboard,
	LogOut,
	Globe,
	Tag,
} from "lucide-react";

// --- Types ---

interface UserInfo {
	id: string;
	username: string;
	email: string;
	avatar?: string;
	role?: "user" | "admin";
}

interface SidebarProps {
	genres: string[];
	countries: string[];
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	isAuthenticated: boolean;
	user: UserInfo | null;
	logout: () => void;
}

// NavButton mimics SidebarMenuButton styling without requiring SidebarProvider context
function NavButton({
	className,
	children,
	...props
}: React.ComponentProps<"button">) {
	return (
		<button
			className={cn(
				"flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-colors [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

// --- Main Component ---

export default function Sidebar({
	genres,
	countries,
	searchQuery,
	setSearchQuery,
	handleSearchKeyDown,
	isAuthenticated,
	user,
	logout,
}: SidebarProps) {
	const router = useRouter();

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					variant='ghost'
					size='icon'
					className='lg:hidden text-gray-400 hover:text-white hover:bg-white/10 rounded-full'
				>
					<Menu className='h-5 w-5' />
				</Button>
			</SheetTrigger>
			<SheetContent
				side='right'
				className='w-80 bg-[#0d0d1a] border-white/10 p-0 overflow-hidden'
			>
				<SheetTitle className='sr-only'>Menu điều hướng</SheetTitle>
				<div className='flex flex-col h-full'>
					{/* Header */}
					<SidebarHeader className='p-5 border-b border-white/5'>
						<div className='flex items-center gap-2'>
							<Image
								src={icon}
								alt='RapPhim Logo'
								width={32}
								height={32}
								className='rounded-lg'
							/>
							<span className='text-lg font-bold text-white'>
								RapPhim
							</span>
						</div>
					</SidebarHeader>

					{/* Content */}
					<SidebarContent className='overflow-y-auto overflow-x-hidden'>
						{/* Search */}
						<SidebarGroup>
							<SidebarGroupContent>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none' />
									<SidebarInput
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										onKeyDown={handleSearchKeyDown}
										placeholder='Tìm kiếm phim...'
										className='pl-9 bg-white/5 border-white/10 rounded-full text-sm h-9'
									/>
								</div>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarSeparator />

						{/* Navigation */}
						<SidebarGroup>
							<SidebarGroupLabel className='text-gray-400 text-xs uppercase tracking-wider'>
								Điều hướng
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<NavButton
											onClick={() => router.push("/")}
											className='text-gray-300 hover:text-white hover:bg-white/5'
										>
											<Flame className='h-4 w-4' />
											<span>Trang Chủ</span>
										</NavButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<NavButton
											onClick={() =>
												router.push("/movie")
											}
											className='text-gray-300 hover:text-white hover:bg-white/5'
										>
											<Film className='h-4 w-4' />
											<span>Phim Lẻ</span>
										</NavButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<NavButton
											onClick={() =>
												router.push("/series")
											}
											className='text-gray-300 hover:text-white hover:bg-white/5'
										>
											<Tv className='h-4 w-4' />
											<span>Phim Bộ</span>
										</NavButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<NavButton
											onClick={() =>
												router.push("/xem-chung")
											}
											className='text-gray-300 hover:text-white hover:bg-white/5'
										>
											<Users className='h-4 w-4' />
											<span>Xem Chung</span>
											<Badge className='ml-auto bg-[#8ae4ff] text-black text-[10px] px-1.5 py-0 border-0 font-bold'>
												NEW
											</Badge>
										</NavButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarSeparator />

						{/* Explore: Genres & Countries */}
						<SidebarGroup>
							<SidebarGroupLabel className='text-gray-400 text-xs uppercase tracking-wider'>
								Khám phá
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{/* Thể Loại */}
									<Collapsible
										asChild
										className='group/collapsible-genre'
									>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<NavButton className='text-gray-300 hover:text-white hover:bg-white/5'>
													<Tag className='h-4 w-4' />
													<span>Thể Loại</span>
													<ChevronRight className='ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-genre:rotate-90' />
												</NavButton>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<SidebarMenuSub>
													{genres.map((genre) => (
														<SidebarMenuSubItem
															key={genre}
														>
															<SidebarMenuSubButton
																onClick={() =>
																	router.push(
																		`/the-loai/${genre.toLowerCase().replace(/\s/g, "-")}`,
																	)
																}
																className='text-gray-500 hover:text-gray-300 cursor-pointer'
															>
																<span>
																	{genre}
																</span>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>

									{/* Quốc Gia */}
									<Collapsible
										asChild
										className='group/collapsible-country'
									>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<NavButton className='text-gray-300 hover:text-white hover:bg-white/5'>
													<Globe className='h-4 w-4' />
													<span>Quốc Gia</span>
													<ChevronRight className='ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-country:rotate-90' />
												</NavButton>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<SidebarMenuSub>
													{countries.map(
														(country) => (
															<SidebarMenuSubItem
																key={country}
															>
																<SidebarMenuSubButton
																	onClick={() =>
																		router.push(
																			`/quoc-gia/${country.toLowerCase().replace(/\s/g, "-")}`,
																		)
																	}
																	className='text-gray-500 hover:text-gray-300 cursor-pointer'
																>
																	<span>
																		{
																			country
																		}
																	</span>
																</SidebarMenuSubButton>
															</SidebarMenuSubItem>
														),
													)}
												</SidebarMenuSub>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarSeparator />

						{/* Personal */}
						<SidebarGroup>
							<SidebarGroupLabel className='text-gray-400 text-xs uppercase tracking-wider'>
								Cá nhân
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<NavButton
											onClick={() =>
												router.push("/saved")
											}
											className='text-gray-300 hover:text-white hover:bg-white/5'
										>
											<Bookmark className='h-4 w-4' />
											<span>Phim đã lưu</span>
										</NavButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<NavButton
											onClick={() =>
												router.push("/history")
											}
											className='text-gray-300 hover:text-white hover:bg-white/5'
										>
											<History className='h-4 w-4' />
											<span>Lịch sử xem</span>
										</NavButton>
									</SidebarMenuItem>
									{user?.role === "admin" && (
										<SidebarMenuItem>
											<NavButton
												onClick={() =>
													router.push("/admin")
												}
												className='text-gray-300 hover:text-white hover:bg-white/5'
											>
												<LayoutDashboard className='h-4 w-4' />
												<span>Trang quản lý</span>
											</NavButton>
										</SidebarMenuItem>
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>

					{/* Footer */}
					<SidebarFooter className='p-4 border-t border-white/5'>
						{isAuthenticated && user ?
							<div className='flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors group'>
								<button
									onClick={() => router.push("/profile")}
									className='flex items-center gap-3 flex-1 min-w-0'
								>
									{user.avatar ?
										<Image
											src={user.avatar}
											alt={user.username || "User"}
											width={40}
											height={40}
											unoptimized
											className='h-10 w-10 rounded-full border border-white/10 object-cover shadow-lg shadow-primary/20'
										/>
									:	<span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20'>
											<User className='h-4 w-4' />
										</span>
									}
									<div className='min-w-0 flex-1 text-left'>
										<p className='text-sm font-semibold text-white truncate text-left'>
											{user.username || "Tài khoản"}
										</p>
										<p className='text-xs text-gray-400 truncate text-left'>
											{user.email}
										</p>
									</div>
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										logout();
									}}
									className='flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors'
									title='Đăng xuất'
								>
									<LogOut className='h-4 w-4' />
								</button>
							</div>
						:	<Button
								onClick={() => router.push("/sign-in")}
								className='w-full bg-primary hover:bg-primary/90 text-black rounded-full font-bold shadow-lg shadow-primary/20'
							>
								<User className='h-4 w-4 mr-2' />
								Đăng nhập / Đăng ký
							</Button>
						}
					</SidebarFooter>
				</div>
			</SheetContent>
		</Sheet>
	);
}
