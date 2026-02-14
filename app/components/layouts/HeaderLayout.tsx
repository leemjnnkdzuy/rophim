"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { icon } from "@/app/assets";
import { Input } from "@/app/components/ui/input";
import { SearchWithSuggestions } from "@/app/components/common/SearchSuggestions";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetTitle,
} from "@/app/components/ui/sheet";
import {
	Search,
	ChevronDown,
	Menu,
	User,
	Bookmark,
	History,
	LogOut,
	Film,
	Tv,
	Users,
	Calendar,
	Flame,
} from "lucide-react";
import api from "@/app/utils/axios";
import { useAuth } from "@/app/hooks/useAuth";

// --- Data ---
const DEFAULT_GENRES = [
	"Hành Động",
	"Tình Cảm",
	"Hài Hước",
	"Kinh Dị",
	"Viễn Tưởng",
	"Tâm Lý",
	"Phiêu Lưu",
	"Hoạt Hình",
	"Võ Thuật",
	"Cổ Trang",
	"Chiến Tranh",
	"Âm Nhạc",
	"Thể Thao",
	"Bí Ẩn",
	"Gia Đình",
	"Hình Sự",
];

const countries = [
	"Trung Quốc",
	"Hàn Quốc",
	"Nhật Bản",
	"Thái Lan",
	"Âu Mỹ",
	"Đài Loan",
	"Hồng Kông",
	"Ấn Độ",
	"Anh",
	"Pháp",
	"Đức",
	"Việt Nam",
];

// --- Sub Components ---

interface NavDropdownProps {
	label: string;
	items: string[];
	icon?: React.ReactNode;
}

function NavDropdown({ label, items, icon }: NavDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className='flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5 cursor-pointer'>
					{icon}
					{label}
					<ChevronDown className='h-3.5 w-3.5 opacity-60' />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className='w-[420px] p-3 bg-[#1a1a2e]/95 backdrop-blur-xl border-white/10'
				align='start'
			>
				<div className='grid grid-cols-3 gap-1'>
					{items.map((item) => (
						<DropdownMenuItem
							key={item}
							className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer px-3 py-2'
						>
							<Link
								href={`/the-loai/${item.toLowerCase().replace(/\s/g, "-")}`}
								className='w-full'
							>
								{item}
							</Link>
						</DropdownMenuItem>
					))}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface NavLinkProps {
	href: string;
	label: string;
	icon?: React.ReactNode;
	badge?: string;
}

function NavLink({ href, label, icon, badge }: NavLinkProps) {
	return (
		<Link
			href={href}
			className='flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5'
		>
			{icon}
			{label}
			{badge && (
				<Badge className='bg-[#8ae4ff] text-black text-[10px] px-1.5 py-0 border-0 font-bold tracking-wider'>
					{badge}
				</Badge>
			)}
		</Link>
	);
}

// --- Main Layout ---

export default function HeaderLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
	const { isAuthenticated, user, logout } = useAuth();

	// Handle search
	const handleSearch = () => {
		if (searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	// Handle search on Enter key
	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSearch();
		}
	};

	useEffect(() => {
		const fetchGenres = async () => {
			try {
				const response = await api.get("/genres");
				if (
					response.data &&
					Array.isArray(response.data) &&
					response.data.length > 0
				) {
					setGenres(response.data.filter(Boolean));
				}
			} catch (error) {
				console.error("Failed to fetch genres list", error);
			}
		};
		fetchGenres();
	}, []);

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<header className='sticky top-0 z-50 w-full border-b border-white/5 bg-[#0d0d1a]/80 backdrop-blur-2xl'>
				<div className='w-full px-4 lg:px-32'>
					<div className='flex items-center justify-between h-16 gap-4'>
						<div className='flex items-center gap-6 flex-1'>
							{/* Logo */}
							<Link
								href='/'
								className='flex items-center gap-2 shrink-0 group'
							>
								<div className='relative'>
									<div className='absolute -inset-1 rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity' />
									<Image
										src={icon}
										alt='RapPhim Logo'
										width={40}
										height={40}
										className='relative rounded-lg'
									/>
								</div>
								<span className='text-xl font-bold text-white'>
									RapPhim
								</span>
							</Link>

							{/* Desktop Nav */}
							<nav className='hidden xl:flex items-center gap-1'>
								<NavDropdown label='Thể Loại' items={genres} />
								<NavLink href='/movie' label='Phim Lẻ' />
								<NavLink href='/series' label='Phim Bộ' />
								<NavLink
									href='/xem-chung'
									label='Xem Chung'
									badge='NEW'
								/>
								<NavDropdown
									label='Quốc Gia'
									items={countries}
								/>
							</nav>

							{/* Search Bar - Desktop */}
							<SearchWithSuggestions />
						</div>

						{/* Right Side */}
						<div className='flex items-center gap-2 shrink-0'>
							{/* Search icon mobile */}
							<Button
								variant='ghost'
								size='icon'
								onClick={() => router.push("/search")}
								className='md:hidden text-gray-400 hover:text-white hover:bg-white/10 rounded-full'
							>
								<Search className='h-5 w-5' />
							</Button>

							{/* Login Button / Avatar */}
							{isAuthenticated ?
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											className='hidden sm:flex items-center'
											aria-label='Tài khoản'
										>
											{user?.avatar ?
												<Image
													src={user.avatar}
													alt={
														user.username || "User"
													}
													width={36}
													height={36}
													unoptimized
													className='h-9 w-9 rounded-full border border-white/10 object-cover shadow-lg shadow-primary/20'
												/>
												: <span className='flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20'>
													<User className='h-4 w-4' />
												</span>
											}
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='end'
										className='w-44 bg-[#1a1a2e]/95 backdrop-blur-xl border-white/10'
									>
										<DropdownMenuItem className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'>
											<Link
												href='/profile'
												className='w-full flex items-center gap-2'
											>
												<User className='h-4 w-4' />
												Hồ sơ
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'>
											<Link
												href='/saved'
												className='w-full flex items-center gap-2'
											>
												<Bookmark className='h-4 w-4' />
												Phim đã lưu
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'>
											<Link
												href='/history'
												className='w-full flex items-center gap-2'
											>
												<History className='h-4 w-4' />
												Lịch sử xem
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem
											className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'
											onSelect={(event) => {
												event.preventDefault();
												logout();
											}}
										>
											<span className='flex items-center gap-2'>
												<LogOut className='h-4 w-4' />
												Đăng xuất
											</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								: <Link href='/sign-in'>
									<Button className='hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-black rounded-full px-5 font-bold shadow-lg shadow-primary/20 h-9 transition-all duration-300'>
										<User className='h-4 w-4' />
										Đăng Nhập
									</Button>
								</Link>
							}

							{/* Mobile menu */}
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
									className='w-80 bg-[#0d0d1a] border-white/10 p-0'
								>
									<SheetTitle className='sr-only'>
										Menu điều hướng
									</SheetTitle>
									<div className='flex flex-col h-full'>
										{/* Mobile Header */}
										<div className='p-5 border-b border-white/5'>
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
										</div>

										{/* Mobile Search */}
										<div className='p-4'>
											<div className='relative'>
												<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
												<Input
													value={searchQuery}
													onChange={(e) =>
														setSearchQuery(
															e.target.value,
														)
													}
													onKeyDown={
														handleSearchKeyDown
													}
													placeholder='Tìm kiếm phim...'
													className='pl-9 bg-white/5 border-white/10 rounded-full text-sm'
												/>
											</div>
										</div>

										{/* Mobile Nav Items */}
										<div className='flex-1 overflow-y-auto px-3 pb-4'>
											<div className='space-y-1'>
												<MobileNavLink
													href='/'
													label='Trang Chủ'
													icon={
														<Flame className='h-4 w-4' />
													}
												/>
												<MobileNavSection
													title='Thể Loại'
													items={genres}
												/>
												<MobileNavLink
													href='/movie'
													label='Phim Lẻ'
													icon={
														<Film className='h-4 w-4' />
													}
												/>
												<MobileNavLink
													href='/series'
													label='Phim Bộ'
													icon={
														<Tv className='h-4 w-4' />
													}
												/>
												<MobileNavLink
													href='/xem-chung'
													label='Xem Chung'
													icon={
														<Users className='h-4 w-4' />
													}
													badge='NEW'
												/>
												<MobileNavSection
													title='Quốc Gia'
													items={countries}
												/>
												<MobileNavLink
													href='/dien-vien'
													label='Diễn Viên'
													icon={
														<Users className='h-4 w-4' />
													}
												/>
												<MobileNavLink
													href='/lich-chieu'
													label='Lịch Chiếu'
													icon={
														<Calendar className='h-4 w-4' />
													}
												/>
											</div>
										</div>

										{/* Mobile Footer */}
										<div className='p-4 border-t border-white/5'>
											{isAuthenticated && user?.avatar ?
												<Link
													href='/profile'
													className='flex items-center gap-3'
												>
													<Image
														src={user.avatar}
														alt={
															user?.username ||
															"User"
														}
														width={40}
														height={40}
														unoptimized
														className='h-10 w-10 rounded-full border border-white/10 object-cover shadow-lg shadow-primary/20'
													/>
													<div className='min-w-0'>
														<p className='text-sm font-semibold text-white truncate'>
															{user?.username ||
																"Tài khoản"}
														</p>
														<p className='text-xs text-gray-400 truncate'>
															Xem hồ sơ
														</p>
													</div>
												</Link>
												: isAuthenticated ?
													<Link
														href='/profile'
														className='flex items-center gap-3'
													>
														<span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20'>
															<User className='h-4 w-4' />
														</span>
														<div className='min-w-0'>
															<p className='text-sm font-semibold text-white truncate'>
																{user?.username ||
																	"Tài khoản"}
															</p>
															<p className='text-xs text-gray-400 truncate'>
																Xem hồ sơ
															</p>
														</div>
													</Link>
													: <Link
														href='/sign-in'
														className='block'
													>
														<Button className='w-full bg-primary hover:bg-primary/90 text-black rounded-full font-bold shadow-lg shadow-primary/20'>
															<User className='h-4 w-4 mr-2' />
															Đăng nhập / Đăng ký
														</Button>
													</Link>
											}
										</div>
									</div>
								</SheetContent>
							</Sheet>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main>{children}</main>
		</div>
	);
}

// --- Mobile Nav Components ---

function MobileNavLink({
	href,
	label,
	icon,
	badge,
}: {
	href: string;
	label: string;
	icon: React.ReactNode;
	badge?: string;
}) {
	return (
		<Link
			href={href}
			className='flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors'
		>
			{icon}
			{label}
			{badge && (
				<Badge className='bg-[#8ae4ff] text-black text-[10px] px-1.5 py-0 border-0 font-bold'>
					{badge}
				</Badge>
			)}
		</Link>
	);
}

function MobileNavSection({ title, items }: { title: string; items: string[] }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='flex items-center justify-between w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors'
			>
				<span className='flex items-center gap-3'>
					<Film className='h-4 w-4' />
					{title}
				</span>
				<ChevronDown
					className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>
			{isOpen && (
				<div className='ml-6 mt-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200'>
					{items.map((item) => (
						<Link
							key={item}
							href={`/${title.toLowerCase().replace(/\s/g, "-")}/${item.toLowerCase().replace(/\s/g, "-")}`}
							className='block px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 rounded transition-colors'
						>
							{item}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
