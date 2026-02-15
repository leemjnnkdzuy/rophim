"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
	Users,
	Search,
	ChevronLeft,
	ChevronRight,
	Shield,
	ShieldCheck,
	User,
	MoreHorizontal,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { useGlobalNotificationPopup } from "@/app/hooks/useGlobalNotificationPopup";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import api from "@/app/utils/axios";

interface Member {
	_id: string;
	username: string;
	email: string;
	avatar?: string;
	role: "user" | "admin";
	isVerified: boolean;
	isActive: boolean;
	createdAt: string;
}

export default function MembersDashboards() {
	const [members, setMembers] = useState<Member[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const { showNotification } = useGlobalNotificationPopup();

	const fetchMembers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/admin/members", {
				params: { page, limit: 20, search: searchQuery },
			});
			setMembers(res.data.members || []);
			setTotalPages(res.data.totalPages || 1);
		} catch (error) {
			console.error("Failed to fetch members:", error);
			showNotification("Không thể tải danh sách thành viên", "error");
		} finally {
			setLoading(false);
		}
	}, [page, searchQuery, showNotification]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	const handleSearch = () => {
		setPage(1);
		fetchMembers();
	};

	const handleUpdateMember = async (
		userId: string,
		updates: Partial<Member>,
	) => {
		try {
			const res = await api.patch("/admin/members", {
				userId,
				...updates,
			});

			if (res.data.success) {
				setMembers((prev) =>
					prev.map((m) =>
						m._id === userId ?
							{ ...m, ...updates }
							: m,
					),
				);
				showNotification("Cập nhật thành công", "success");
			} else {
				showNotification(
					res.data.message || "Cập nhật thất bại",
					"error",
				);
			}
		} catch (error) {
			console.error("Update member error:", error);
			showNotification("Lỗi server khi cập nhật", "error");
		}
	};

	return (
		<div className='space-y-6'>
			{/* Page Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-bold text-white flex items-center gap-2'>
						<Users className='h-6 w-6 text-primary' />
						Quản lý thành viên
					</h1>
					<p className='text-sm text-gray-400 mt-1'>
						Xem và quản lý tài khoản người dùng
					</p>
				</div>
			</div>

			{/* Search */}
			<div className='flex gap-2'>
				<div className='relative flex-1 max-w-md'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder='Tìm kiếm theo tên hoặc email...'
						className='pl-9 bg-white/5 border-white/10 text-sm'
					/>
				</div>
				<Button
					onClick={handleSearch}
					className='bg-primary hover:bg-primary/90 text-black font-medium'
				>
					Tìm kiếm
				</Button>
			</div>

			{/* Table */}
			<div className='rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='border-b border-white/5'>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Người dùng
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Email
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Vai trò
								</th>
								<th className='text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Trạng thái
								</th>
								<th className='text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Ngày tạo
								</th>
								<th className='text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3'>
									Thao tác
								</th>
							</tr>
						</thead>
						<tbody>
							{loading ?
								<tr>
									<td
										colSpan={6}
										className='text-center py-12 text-gray-400'
									>
										Đang tải...
									</td>
								</tr>
								: members.length === 0 ?
									<tr>
										<td
											colSpan={6}
											className='text-center py-12 text-gray-400'
										>
											Không tìm thấy thành viên nào
										</td>
									</tr>
									: members.map((member) => (
										<tr
											key={member._id}
											className='border-b border-white/5 hover:bg-white/[0.02] transition-colors'
										>
											<td className='px-4 py-3'>
												<div className='flex items-center gap-3'>
													{member.avatar ?
														<Image
															src={member.avatar}
															alt={member.username}
															width={32}
															height={32}
															unoptimized
															className='h-8 w-8 rounded-full object-cover border border-white/10'
														/>
														: <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10'>
															<User className='h-4 w-4 text-gray-400' />
														</div>
													}
													<span className='text-sm font-medium text-white'>
														{member.username}
													</span>
												</div>
											</td>
											<td className='px-4 py-3 text-sm text-gray-400'>
												{member.email}
											</td>
											<td className='px-4 py-3'>
												<Badge
													className={`text-xs ${member.role === "admin" ?
														"bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
														: "bg-blue-500/10 text-blue-400 border-blue-500/20"
														}`}
												>
													{member.role === "admin" ?
														<ShieldCheck className='h-3 w-3 mr-1' />
														: <Shield className='h-3 w-3 mr-1' />
													}
													{member.role === "admin" ?
														"Admin"
														: "User"}
												</Badge>
											</td>
											<td className='px-4 py-3'>
												<div className='flex justify-center'>
													<Switch
														checked={member.isActive}
														onCheckedChange={(checked) =>
															handleUpdateMember(
																member._id,
																{
																	isActive:
																		checked,
																},
															)
														}
													/>
												</div>
											</td>
											<td className='px-4 py-3 text-sm text-gray-400'>
												{new Date(
													member.createdAt,
												).toLocaleDateString("vi-VN")}
											</td>
											<td className='px-4 py-3 text-right'>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant='ghost'
															size='icon'
															className='h-8 w-8 text-gray-400 hover:text-white'
														>
															<MoreHorizontal className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align='end'
														className='bg-[#0a0a0a] border-white/10 text-white'
													>
														<DropdownMenuItem
															onClick={() =>
																handleUpdateMember(
																	member._id,
																	{
																		role:
																			member.role ===
																				"admin" ?
																				"user"
																				: "admin",
																	},
																)
															}
															className='hover:bg-white/10 cursor-pointer'
														>
															{member.role === "admin" ?
																"Hạ xuống User"
																: "Thăng lên Admin"}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									))
							}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className='flex items-center justify-center gap-2'>
					<Button
						variant='ghost'
						size='icon'
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						className='text-gray-400 hover:text-white hover:bg-white/10'
					>
						<ChevronLeft className='h-4 w-4' />
					</Button>
					<span className='text-sm text-gray-400'>
						Trang {page} / {totalPages}
					</span>
					<Button
						variant='ghost'
						size='icon'
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
						className='text-gray-400 hover:text-white hover:bg-white/10'
					>
						<ChevronRight className='h-4 w-4' />
					</Button>
				</div>
			)}
		</div>
	);
}
