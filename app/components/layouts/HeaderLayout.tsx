"use client";

import React, {useState, useEffect} from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {icon} from "@/app/assets";
import {Input} from "@/app/components/ui/input";
import {SearchWithSuggestions} from "@/app/components/common/SearchSuggestions";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
	Search,
	ChevronDown,
	User,
	Bookmark,
	History,
	LogOut,
	LayoutDashboard,
} from "lucide-react";
import Sidebar from "@/app/components/common/Sidebar";
import api from "@/app/utils/axios";
import {useAuth} from "@/app/hooks/useAuth";

// --- Sub Components ---

interface NavDropdownProps {
	label: string;
	items: string[];
	icon?: React.ReactNode;
	basePath?: string;
}

function NavDropdown({
	label,
	items,
	icon,
	basePath = "/the-loai",
}: NavDropdownProps) {
	const router = useRouter();
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
							onClick={() =>
								router.push(
									`${basePath}/${item.toLowerCase().replace(/\s/g, "-")}`,
								)
							}
						>
							{item}
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

function NavLink({href, label, icon, badge}: NavLinkProps) {
	const router = useRouter();
	return (
		<button
			onClick={() => router.push(href)}
			className='flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/5'
		>
			{icon}
			{label}
			{badge && (
				<Badge className='bg-[#8ae4ff] text-black text-[10px] px-1.5 py-0 border-0 font-bold tracking-wider'>
					{badge}
				</Badge>
			)}
		</button>
	);
}

// --- Main Layout ---

export default function HeaderLayout({children}: {children: React.ReactNode}) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [genres, setGenres] = useState<string[]>([]);
	const [countries, setCountries] = useState<string[]>([]);
	const {isAuthenticated, user, logout} = useAuth();

	// Handle search (mobile)
	const handleSearch = () => {
		if (searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSearch();
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch genres
				const genresResponse = await api.get("/genres");
				if (
					genresResponse.data &&
					Array.isArray(genresResponse.data) &&
					genresResponse.data.length > 0
				) {
					setGenres(genresResponse.data.filter(Boolean));
				}

				// Fetch countries
				const countriesResponse = await api.get("/countries");
				if (
					countriesResponse.data &&
					Array.isArray(countriesResponse.data) &&
					countriesResponse.data.length > 0
				) {
					setCountries(countriesResponse.data.filter(Boolean));
				}
			} catch (error) {
				console.error(
					"Failed to fetch genres or countries list",
					error,
				);
			}
		};
		fetchData();
	}, []);

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<header className='sticky top-0 z-50 w-full border-b border-white/5 bg-[#0d0d1a]/80 backdrop-blur-2xl'>
				<div className='w-full px-4 lg:px-32'>
					<div className='flex items-center justify-between h-16 gap-4'>
						<div className='flex items-center gap-6 flex-1'>
							{/* Logo */}
							<button
								onClick={() => router.push("/")}
								className='flex items-center gap-2 shrink-0 group cursor-pointer'
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
								<span className='text-3xl font-alfa text-white mt-1.5'>
									RapPhim
								</span>
							</button>

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
									basePath='/quoc-gia'
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
													className='h-9 w-9 rounded-full border border-white/10 object-cover shadow-lg shadow-primary/20 cursor-pointer'
												/>
											:	<span className='flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20 cursor-pointer'>
													<User className='h-4 w-4' />
												</span>
											}
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='end'
										className='w-44 bg-[#1a1a2e]/95 backdrop-blur-xl border-white/10'
									>
										<DropdownMenuItem
											className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'
											onClick={() =>
												router.push("/profile")
											}
										>
											<User className='h-4 w-4 mr-2' />
											Hồ sơ
										</DropdownMenuItem>
										<DropdownMenuItem
											className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'
											onClick={() =>
												router.push("/saved")
											}
										>
											<Bookmark className='h-4 w-4 mr-2' />
											Phim đã lưu
										</DropdownMenuItem>
										<DropdownMenuItem
											className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'
											onClick={() =>
												router.push("/history")
											}
										>
											<History className='h-4 w-4 mr-2' />
											Lịch sử xem
										</DropdownMenuItem>
										{user?.role === "admin" && (
											<DropdownMenuItem
												className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'
												onClick={() =>
													router.push("/admin")
												}
											>
												<LayoutDashboard className='h-4 w-4 mr-2' />
												Trang quản lý
											</DropdownMenuItem>
										)}
										<DropdownMenuItem
											className='text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer'
											onSelect={(event) => {
												event.preventDefault();
												logout();
											}}
										>
											<LogOut className='h-4 w-4 mr-2' />
											Đăng xuất
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							:	<Button
									onClick={() => router.push("/sign-in")}
									className='hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-black rounded-full px-5 font-bold shadow-lg shadow-primary/20 h-9 transition-all duration-300 cursor-pointer'
								>
									<User className='h-4 w-4' />
									Đăng Nhập
								</Button>
							}

							{/* Mobile menu */}
							<Sidebar
								genres={genres}
								countries={countries}
								searchQuery={searchQuery}
								setSearchQuery={setSearchQuery}
								handleSearchKeyDown={handleSearchKeyDown}
								isAuthenticated={isAuthenticated}
								user={user}
								logout={logout}
							/>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main>{children}</main>
		</div>
	);
}
