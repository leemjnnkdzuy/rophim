"use client";

import React from "react";
import {
	LayoutDashboard,
	Users,
	Film,
	MessageSquare,
	TrendingUp,
	Eye,
	Home,
} from "lucide-react";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	description?: string;
	trend?: string;
}

function StatCard({title, value, icon, description, trend}: StatCardProps) {
	return (
		<div className='rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<div className='space-y-1'>
					<p className='text-sm text-gray-400'>{title}</p>
					<p className='text-2xl font-bold text-white'>{value}</p>
					{description && (
						<p className='text-xs text-gray-500'>{description}</p>
					)}
				</div>
				<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
					{icon}
				</div>
			</div>
			{trend && (
				<div className='mt-3 flex items-center gap-1 text-xs text-green-400'>
					<TrendingUp className='h-3 w-3' />
					<span>{trend}</span>
				</div>
			)}
		</div>
	);
}

export default function MainDashboards() {
	return (
		<div className='space-y-6'>
			{/* Page Header */}
			<div>
				<h1 className='text-2xl font-bold text-white'>Tổng quan</h1>
				<p className='text-sm text-gray-400 mt-1'>
					Xem tổng quan hoạt động của hệ thống
				</p>
			</div>

			{/* Stats Grid */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				<StatCard
					title='Tổng thành viên'
					value='—'
					icon={<Users className='h-6 w-6' />}
					description='Người dùng đã đăng ký'
				/>
				<StatCard
					title='Tổng phim'
					value='—'
					icon={<Film className='h-6 w-6' />}
					description='Phim trong hệ thống'
				/>
				<StatCard
					title='Bình luận'
					value='—'
					icon={<MessageSquare className='h-6 w-6' />}
					description='Tổng bình luận'
				/>
				<StatCard
					title='Lượt xem'
					value='—'
					icon={<Eye className='h-6 w-6' />}
					description='Tổng lượt xem phim'
				/>
			</div>

			{/* Quick Actions */}
			<div>
				<h2 className='text-lg font-semibold text-white mb-4'>
					Truy cập nhanh
				</h2>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					{[
						{
							title: "Quản lý thành viên",
							href: "/admin/members",
							icon: <Users className='h-5 w-5' />,
							description: "Xem, chỉnh sửa và quản lý tài khoản",
						},
						{
							title: "Quản lý phim",
							href: "/admin/films",
							icon: <Film className='h-5 w-5' />,
							description: "Thêm, sửa, xóa phim trong hệ thống",
						},
						{
							title: "Quản lý bình luận",
							href: "/admin/comments",
							icon: <MessageSquare className='h-5 w-5' />,
							description: "Duyệt và quản lý bình luận",
						},
						{
							title: "Nội dung trang chủ",
							href: "/admin/home-content",
							icon: <Home className='h-5 w-5' />,
							description: "Chọn phim nổi bật và tạo danh mục",
						},
					].map((item) => (
						<a
							key={item.href}
							href={item.href}
							className='group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-primary/20 hover:bg-primary/5'
						>
							<div className='flex items-center gap-3 mb-2'>
								<div className='text-gray-400 group-hover:text-primary transition-colors'>
									{item.icon}
								</div>
								<h3 className='text-sm font-medium text-white group-hover:text-primary transition-colors'>
									{item.title}
								</h3>
							</div>
							<p className='text-xs text-gray-500'>
								{item.description}
							</p>
						</a>
					))}
				</div>
			</div>
		</div>
	);
}
