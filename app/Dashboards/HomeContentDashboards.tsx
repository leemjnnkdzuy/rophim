"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import Image from "next/image";
import {
	closestCenter,
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {
	Home,
	Search,
	Plus,
	Trash2,
	Upload,
	Save,
	X,
	GripVertical,
	Sparkles,
} from "lucide-react";
import {Input} from "@/app/components/ui/input";
import {Button} from "@/app/components/ui/button";
import {Badge} from "@/app/components/ui/badge";
import {useGlobalNotificationPopup} from "@/app/hooks/useGlobalNotificationPopup";
import {
	fetchHomeContent,
	saveHomeContent,
	searchAdminFilms,
	searchFilmsBySlugs,
	imageToBase64,
	buildHomeContentPayload,
	serializeHomeContentPayload,
	type FilmItem,
	type CategoryCard,
} from "@/app/services/HomeContentService";

export default function HomeContentDashboards() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [initialPayloadSnapshot, setInitialPayloadSnapshot] = useState<
		string | null
	>(null);
	const {showNotification} = useGlobalNotificationPopup();

	// Featured Films
	const [featuredFilms, setFeaturedFilms] = useState<FilmItem[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<FilmItem[]>([]);
	const [searching, setSearching] = useState(false);

	// Category Cards
	const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
	const [editingCard, setEditingCard] = useState<CategoryCard | null>(null);
	const [showCardModal, setShowCardModal] = useState(false);
	const [editingCardFilms, setEditingCardFilms] = useState(false);
	const [selectedCardForFilms, setSelectedCardForFilms] =
		useState<CategoryCard | null>(null);
	const [categoryFilmSearch, setCategoryFilmSearch] = useState("");
	const [categoryFilmResults, setCategoryFilmResults] = useState<FilmItem[]>(
		[],
	);
	const [searchingCategoryFilms, setSearchingCategoryFilms] = useState(false);
	const [shouldAutoSaveCategory, setShouldAutoSaveCategory] = useState(false);

	// Fetch home content configuration
	const fetchHomeContentData = useCallback(
		async (showLoading = true) => {
			if (showLoading) setLoading(true);
			try {
				const data = await fetchHomeContent();
				const {
					featuredFilms: fetchedFeaturedFilms,
					categoryCards: fetchedCategoryCards,
				} = data.homeContent;

				setFeaturedFilms(fetchedFeaturedFilms);
				setCategoryCards(fetchedCategoryCards);
				setInitialPayloadSnapshot(
					serializeHomeContentPayload(
						buildHomeContentPayload(
							fetchedFeaturedFilms,
							fetchedCategoryCards,
						),
					),
				);
			} catch (error) {
				console.error("Failed to fetch home content:", error);
				showNotification(
					"Không thể tải cấu hình trang chủ. Vui lòng thử lại.",
					"error",
				);
			} finally {
				setLoading(false);
			}
		},
		[showNotification],
	);

	// Search films
	const searchFeaturedFilms = useCallback(
		async (query: string) => {
			if (!query.trim()) {
				setSearchResults([]);
				return;
			}

			setSearching(true);
			try {
				const films = await searchAdminFilms(query, 10);
				setSearchResults(films);
			} catch (error) {
				console.error("Failed to search films:", error);
				showNotification("Không thể tìm kiếm phim.", "error");
			} finally {
				setSearching(false);
			}
		},
		[showNotification],
	);

	// Add featured film
	const addFeaturedFilm = (film: FilmItem) => {
		if (featuredFilms.length >= 5) {
			showNotification("Tối đa 5 phim nổi bật", "error");
			return;
		}
		if (featuredFilms.some((f) => f.slug === film.slug)) {
			showNotification("Phim đã được thêm", "error");
			return;
		}
		setFeaturedFilms([...featuredFilms, film]);
		setSearchQuery("");
		setSearchResults([]);
	};

	// Remove featured film
	const removeFeaturedFilm = (slug: string) => {
		setFeaturedFilms(featuredFilms.filter((f) => f.slug !== slug));
	};

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {distance: 6},
		}),
	);

	const handleFeaturedDragEnd = (event: DragEndEvent) => {
		const {active, over} = event;
		if (!over || active.id === over.id) return;
		setFeaturedFilms((items) => {
			const oldIndex = items.findIndex(
				(film) => film.slug === String(active.id),
			);
			const newIndex = items.findIndex(
				(film) => film.slug === String(over.id),
			);
			if (oldIndex < 0 || newIndex < 0) return items;
			return arrayMove(items, oldIndex, newIndex);
		});
	};

	// Add or update category card
	const saveCategoryCard = (card: CategoryCard) => {
		if (card._id && !card._id.startsWith("temp-")) {
			// Update existing with real ID
			const updatedCard = {
				...card,
				href: `/danh-muc/${card._id}`,
			};
			setCategoryCards(
				categoryCards.map((c) =>
					c._id === card._id ? updatedCard : c,
				),
			);
		} else {
			// Add new - will get real ID after save
			const tempId = `temp-${Date.now()}`;
			const newCard = {
				...card,
				_id: tempId,
				href: `/danh-muc/${tempId}`, // Temporary, will be updated after backend saves
				order: categoryCards.length,
				filmSlugs: card.filmSlugs || [],
			};
			setCategoryCards([...categoryCards, newCard]);
			setShouldAutoSaveCategory(true);
		}
		setShowCardModal(false);
		setEditingCard(null);
	};

	// Delete category card
	const deleteCategoryCard = (id: string) => {
		setCategoryCards(categoryCards.filter((c) => c._id !== id));
	};

	// Search films for category
	const searchCategoryFilmsData = useCallback(
		async (query: string) => {
			if (!query.trim()) {
				setCategoryFilmResults([]);
				return;
			}

			setSearchingCategoryFilms(true);
			try {
				const films = await searchAdminFilms(query, 10);
				setCategoryFilmResults(films);
			} catch (error) {
				console.error("Failed to search films:", error);
				showNotification("Không thể tìm kiếm phim.", "error");
			} finally {
				setSearchingCategoryFilms(false);
			}
		},
		[showNotification],
	);

	// Add film to category
	const addFilmToCategory = (cardId: string, film: FilmItem) => {
		setCategoryCards((prev) =>
			prev.map((card) => {
				if (card._id === cardId) {
					const filmSlugs = card.filmSlugs || [];
					if (filmSlugs.includes(film.slug)) {
						showNotification("Phim đã có trong danh mục", "error");
						return card;
					}
					return {
						...card,
						filmSlugs: [...filmSlugs, film.slug],
					};
				}
				return card;
			}),
		);
	};

	// Remove film from category
	const removeFilmFromCategory = (cardId: string, slug: string) => {
		setCategoryCards((prev) =>
			prev.map((card) => {
				if (card._id === cardId) {
					return {
						...card,
						filmSlugs: (card.filmSlugs || []).filter(
							(s) => s !== slug,
						),
					};
				}
				return card;
			}),
		);
	};

	// Move category card
	const moveCategoryCard = (index: number, direction: "up" | "down") => {
		const newCards = [...categoryCards];
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= newCards.length) return;
		[newCards[index], newCards[targetIndex]] = [
			newCards[targetIndex],
			newCards[index],
		];
		// Update order
		newCards.forEach((card, idx) => {
			card.order = idx;
		});
		setCategoryCards(newCards);
	};

	// Convert image to base64
	const handleImageToBase64 = async (file: File): Promise<string> => {
		return await imageToBase64(file);
	};

	const currentPayload = useMemo(
		() => buildHomeContentPayload(featuredFilms, categoryCards),
		[featuredFilms, categoryCards],
	);
	const currentPayloadSnapshot = useMemo(
		() => serializeHomeContentPayload(currentPayload),
		[currentPayload],
	);
	const hasChanges =
		initialPayloadSnapshot !== null &&
		currentPayloadSnapshot !== initialPayloadSnapshot;

	// Save all changes
	const saveChanges = async () => {
		if (!hasChanges) return;

		setSaving(true);
		try {
			await saveHomeContent(currentPayload);
			setInitialPayloadSnapshot(currentPayloadSnapshot);
			showNotification("Lưu thành công!", "success");
			// Fetch lại để cập nhật _id thật từ MongoDB
			await fetchHomeContentData(false);
		} catch (error) {
			console.error("Failed to save home content:", error);
			showNotification("Lưu thất bại. Vui lòng thử lại.", "error");
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		fetchHomeContentData();
	}, [fetchHomeContentData]);

	useEffect(() => {
		const timer = setTimeout(() => {
			searchFeaturedFilms(searchQuery);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery, searchFeaturedFilms]);

	useEffect(() => {
		const timer = setTimeout(() => {
			searchCategoryFilmsData(categoryFilmSearch);
		}, 300);
		return () => clearTimeout(timer);
	}, [categoryFilmSearch, searchCategoryFilmsData]);

	useEffect(() => {
		if (shouldAutoSaveCategory && !showCardModal && hasChanges) {
			setShouldAutoSaveCategory(false);
			saveChanges();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shouldAutoSaveCategory, showCardModal]);

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<div className='text-center space-y-3'>
					<div className='h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto' />
					<p className='text-sm text-gray-400'>Đang tải...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-8 pb-10'>
			{/* Page Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold text-white flex items-center gap-2'>
						<Home className='h-6 w-6 text-primary' />
						Quản lý Nội dung Trang chủ
					</h1>
					<p className='text-sm text-gray-400 mt-1'>
						Chọn phim nổi bật và tạo danh mục tùy chỉnh
					</p>
				</div>
				<Button
					onClick={saveChanges}
					disabled={saving || !hasChanges}
					className='bg-primary hover:bg-primary/90 text-black font-semibold'
				>
					{saving ?
						<>
							<div className='h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2' />
							Đang lưu...
						</>
					:	<>
							<Save className='h-4 w-4 mr-2' />
							Lưu thay đổi
						</>
					}
				</Button>
			</div>

			{/* Featured Films Section */}
			<section className='rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm'>
				<div className='mb-4'>
					<h2 className='text-lg font-semibold text-white flex items-center gap-2'>
						<Sparkles className='h-5 w-5 text-primary' />
						Phim Nổi Bật (Hero Section)
					</h2>
					<p className='text-xs text-gray-400 mt-1'>
						Chọn tối đa 5 phim hiển thị ở slider trang chủ
					</p>
				</div>

				{/* Search Box */}
				<div className='relative mb-4'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
					<Input
						placeholder='Tìm kiếm phim để thêm...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500'
					/>
					{searching && (
						<div className='absolute right-3 top-1/2 -translate-y-1/2'>
							<div className='h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
						</div>
					)}
				</div>

				{/* Search Results */}
				{searchResults.length > 0 && (
					<div className='mb-4 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-black/30'>
						{searchResults.map((film) => (
							<div
								key={film.slug}
								className='flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0'
								onClick={() => addFeaturedFilm(film)}
							>
								<Image
									src={film.poster_url}
									alt={film.name}
									width={40}
									height={60}
									className='rounded object-cover'
									unoptimized
								/>
								<div className='flex-1 min-w-0'>
									<p className='text-sm font-medium text-white truncate'>
										{film.name}
									</p>
									<p className='text-xs text-gray-400'>
										{film.slug}
									</p>
								</div>
								<Plus className='h-4 w-4 text-primary' />
							</div>
						))}
					</div>
				)}

				{/* Selected Featured Films */}
				<div className='space-y-2'>
					<div className='flex items-center justify-between mb-2'>
						<span className='text-sm font-medium text-gray-300'>
							Đã chọn: {featuredFilms.length}/5
						</span>
					</div>
					{featuredFilms.length === 0 ?
						<div className='text-center py-10 text-gray-500 text-sm'>
							Chưa có phim nổi bật. Hệ thống sẽ tự động chọn phim
							mới nhất.
						</div>
					:	<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleFeaturedDragEnd}
						>
							<SortableContext
								items={featuredFilms.map((film) => film.slug)}
								strategy={verticalListSortingStrategy}
							>
								<div className='grid gap-3'>
									{featuredFilms.map((film, index) => (
										<SortableFeaturedFilmItem
											key={film.slug}
											film={film}
											index={index}
											onRemove={removeFeaturedFilm}
										/>
									))}
								</div>
							</SortableContext>
						</DndContext>
					}
				</div>
			</section>

			{/* Category Cards Section */}
			<section className='rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm'>
				<div className='flex items-center justify-between mb-4'>
					<div>
						<h2 className='text-lg font-semibold text-white'>
							Danh Mục Nổi Bật
						</h2>
						<p className='text-xs text-gray-400 mt-1'>
							Tạo tối đa 6 thẻ danh mục với ảnh nền tùy chỉnh
						</p>
					</div>
					<Button
						onClick={() => {
							setEditingCard({
								title: "",
								bgImage: "",
								href: "",
								color: "#E8D5FF",
								order: categoryCards.length,
								filmSlugs: [],
							});
							setShowCardModal(true);
						}}
						disabled={categoryCards.length >= 6}
						className='bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30'
					>
						<Plus className='h-4 w-4 mr-2' />
						Thêm danh mục
					</Button>
				</div>

				{/* Category Cards Grid */}
				{categoryCards.length === 0 ?
					<div className='text-center py-10 text-gray-500 text-sm'>
						Chưa có danh mục nào. Nhấn &quot;Thêm danh mục&quot; để
						tạo.
					</div>
				:	<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
						{categoryCards.map((card, index) => (
							<div
								key={card._id}
								className='group relative rounded-xl overflow-hidden h-[140px] border border-white/10 hover:border-primary/30 transition-all'
							>
								{/* Background */}
								{card.bgImage ?
									<div className='absolute inset-0'>
										<Image
											src={card.bgImage}
											alt={card.title}
											fill
											sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
											className='object-cover'
											unoptimized
										/>
										<div className='absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent' />
									</div>
								:	<div
										className='absolute inset-0'
										style={{
											backgroundColor: card.color,
										}}
									>
										<div className='absolute inset-0 bg-gradient-to-br from-white/20 to-transparent' />
									</div>
								}

								{/* Content */}
								<div className='relative h-full flex flex-col justify-between p-4'>
									<div>
										<h3 className='text-lg font-bold text-white drop-shadow-lg'>
											{card.title}
										</h3>
										<p className='text-xs text-white/70 mt-1'>
											{card.href}
										</p>
									</div>

									{/* Actions */}
									<div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
										<button
											onClick={() =>
												moveCategoryCard(index, "up")
											}
											disabled={index === 0}
											className='px-2 py-1 bg-black/50 hover:bg-black/70 text-white rounded text-xs disabled:opacity-30'
										>
											↑
										</button>
										<button
											onClick={() =>
												moveCategoryCard(index, "down")
											}
											disabled={
												index ===
												categoryCards.length - 1
											}
											className='px-2 py-1 bg-black/50 hover:bg-black/70 text-white rounded text-xs disabled:opacity-30'
										>
											↓
										</button>
										<button
											onClick={() => {
												setEditingCard(card);
												setShowCardModal(true);
											}}
											className='px-2 py-1 bg-primary/80 hover:bg-primary text-black rounded text-xs font-medium'
										>
											Sửa
										</button>
										<button
											onClick={() => {
												setSelectedCardForFilms(card);
												setEditingCardFilms(true);
											}}
											className='px-2 py-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded text-xs'
										>
											Phim ({card.filmSlugs?.length || 0})
										</button>
										<button
											onClick={() =>
												deleteCategoryCard(
													card._id || "",
												)
											}
											className='px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded text-xs'
										>
											Xóa
										</button>
									</div>
								</div>

								{/* Order Badge */}
								<div className='absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white'>
									#{index + 1}
								</div>
							</div>
						))}
					</div>
				}
			</section>

			{/* Category Card Modal */}
			{showCardModal && editingCard && (
				<CategoryCardModal
					card={editingCard}
					onSave={saveCategoryCard}
					onClose={() => {
						setShowCardModal(false);
						setEditingCard(null);
					}}
					imageToBase64={handleImageToBase64}
					showNotification={showNotification}
				/>
			)}

			{/* Category Films Modal */}
			{editingCardFilms && selectedCardForFilms && (
				<CategoryFilmsModal
					card={selectedCardForFilms}
					categoryCards={categoryCards}
					searchQuery={categoryFilmSearch}
					setSearchQuery={setCategoryFilmSearch}
					searchResults={categoryFilmResults}
					searching={searchingCategoryFilms}
					onAddFilm={(film) =>
						addFilmToCategory(selectedCardForFilms._id!, film)
					}
					onRemoveFilm={(slug) =>
						removeFilmFromCategory(selectedCardForFilms._id!, slug)
					}
					onClose={() => {
						setEditingCardFilms(false);
						setSelectedCardForFilms(null);
						setCategoryFilmSearch("");
						setCategoryFilmResults([]);
					}}
				/>
			)}
		</div>
	);
}

interface SortableFeaturedFilmItemProps {
	film: FilmItem;
	index: number;
	onRemove: (slug: string) => void;
}

function SortableFeaturedFilmItem({
	film,
	index,
	onRemove,
}: SortableFeaturedFilmItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({id: film.slug});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 ${
				isDragging ? "opacity-70 ring-1 ring-primary/40" : ""
			}`}
		>
			<button
				className='text-gray-400 hover:text-white cursor-grab active:cursor-grabbing touch-none'
				{...attributes}
				{...listeners}
				aria-label='Kéo để đổi thứ tự'
			>
				<GripVertical className='h-4 w-4' />
			</button>
			<Image
				src={film.poster_url}
				alt={film.name}
				width={50}
				height={75}
				className='rounded object-cover'
				unoptimized
			/>
			<div className='flex-1 min-w-0'>
				<p className='text-sm font-medium text-white truncate'>
					{film.name}
				</p>
				<p className='text-xs text-gray-400'>{film.slug}</p>
				<Badge
					variant='outline'
					className='mt-1 text-xs border-primary/30 text-primary'
				>
					Vị trí #{index + 1}
				</Badge>
			</div>
			<button
				onClick={() => onRemove(film.slug)}
				className='text-red-400 hover:text-red-300'
			>
				<Trash2 className='h-4 w-4' />
			</button>
		</div>
	);
}

// Category Card Modal Component
interface CategoryCardModalProps {
	card: CategoryCard;
	onSave: (card: CategoryCard) => void;
	onClose: () => void;
	imageToBase64: (file: File) => Promise<string>;
	showNotification: (message: string, type: "success" | "error") => void;
}

function CategoryCardModal({
	card,
	onSave,
	onClose,
	imageToBase64,
	showNotification,
}: CategoryCardModalProps) {
	const [formData, setFormData] = useState<CategoryCard>(card);
	const [uploading, setUploading] = useState(false);
	const [previewImage, setPreviewImage] = useState(card.bgImage);

	const handleImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			showNotification("Ảnh không được vượt quá 2MB", "error");
			return;
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			showNotification("Vui lòng chọn file ảnh", "error");
			return;
		}

		setUploading(true);
		try {
			const base64 = await imageToBase64(file);
			setFormData({...formData, bgImage: base64});
			setPreviewImage(base64);
			showNotification("Upload ảnh thành công", "success");
		} catch {
			showNotification("Upload ảnh thất bại", "error");
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title.trim()) {
			showNotification("Vui lòng nhập tiêu đề", "error");
			return;
		}
		// Auto-generate href if editing existing or keep empty for new
		const dataToSave = {
			...formData,
			href:
				formData._id && !formData._id.startsWith("temp-") ?
					`/danh-muc/${formData._id}`
				:	formData.href || "",
		};
		onSave(dataToSave);
	};

	return (
		<div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<div className='bg-[#0f1014] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
				<div className='p-6'>
					<div className='flex items-center justify-between mb-6'>
						<h3 className='text-xl font-bold text-white'>
							{card._id ?
								"Chỉnh sửa danh mục"
							:	"Thêm danh mục mới"}
						</h3>
						<button
							onClick={onClose}
							className='text-gray-400 hover:text-white'
						>
							<X className='h-6 w-6' />
						</button>
					</div>

					<form onSubmit={handleSubmit} className='space-y-4'>
						{/* Title */}
						<div>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Tiêu đề <span className='text-red-400'>*</span>
							</label>
							<Input
								value={formData.title}
								onChange={(e) =>
									setFormData({
										...formData,
										title: e.target.value,
									})
								}
								placeholder='VD: Grocery, Educational...'
								className='bg-white/5 border-white/10 text-white'
							/>
						</div>

						{/* Color */}
						<div>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Màu nền mặc định
							</label>
							<div className='flex gap-2'>
								<Input
									type='color'
									value={formData.color}
									onChange={(e) =>
										setFormData({
											...formData,
											color: e.target.value,
										})
									}
									className='w-20 h-10 cursor-pointer'
								/>
								<Input
									value={formData.color}
									onChange={(e) =>
										setFormData({
											...formData,
											color: e.target.value,
										})
									}
									placeholder='#E8D5FF'
									className='flex-1 bg-white/5 border-white/10 text-white'
								/>
							</div>
							<p className='text-xs text-gray-500 mt-1'>
								Màu này sẽ hiển thị khi không có ảnh nền
							</p>
						</div>

						{/* Image Upload */}
						<div>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Ảnh nền (Tùy chọn)
							</label>
							<div className='space-y-3'>
								{previewImage && (
									<div className='relative w-full h-32 rounded-lg overflow-hidden border border-white/10'>
										<Image
											src={previewImage}
											alt='Preview'
											fill
											sizes='100vw'
											className='object-cover'
											unoptimized
										/>
									</div>
								)}
								<div className='flex gap-2'>
									<label className='flex-1 cursor-pointer'>
										<div className='flex items-center justify-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-primary text-sm font-medium transition-colors'>
											<Upload className='h-4 w-4' />
											{uploading ?
												"Đang tải..."
											:	"Upload ảnh"}
										</div>
										<input
											type='file'
											accept='image/*'
											onChange={handleImageUpload}
											className='hidden'
											disabled={uploading}
										/>
									</label>
									{previewImage && (
										<button
											type='button'
											onClick={() => {
												setFormData({
													...formData,
													bgImage: "",
												});
												setPreviewImage("");
											}}
											className='px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm'
										>
											Xóa ảnh
										</button>
									)}
								</div>
								<p className='text-xs text-gray-500'>
									Tối đa 2MB. Ảnh sẽ được lưu dạng Base64
								</p>
							</div>
						</div>

						{/* Actions */}
						<div className='flex gap-3 pt-4'>
							<Button
								type='button'
								onClick={onClose}
								className='flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10'
							>
								Hủy
							</Button>
							<Button
								type='submit'
								className='flex-1 bg-primary hover:bg-primary/90 text-black font-semibold'
							>
								Lưu
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

// Category Films Modal Component
interface CategoryFilmsModalProps {
	card: CategoryCard;
	categoryCards: CategoryCard[];
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	searchResults: FilmItem[];
	searching: boolean;
	onAddFilm: (film: FilmItem) => void;
	onRemoveFilm: (slug: string) => void;
	onClose: () => void;
}

function CategoryFilmsModal({
	card,
	categoryCards,
	searchQuery,
	setSearchQuery,
	searchResults,
	searching,
	onAddFilm,
	onRemoveFilm,
	onClose,
}: CategoryFilmsModalProps) {
	const [films, setFilms] = React.useState<FilmItem[]>([]);
	const [loading, setLoading] = React.useState(true);

	// Find the actual card from categoryCards to get latest filmSlugs
	const currentCard = categoryCards.find((c) => c._id === card._id) || card;
	const filmSlugsKey = (currentCard.filmSlugs || []).join(",");

	// Fetch film details for the category
	React.useEffect(() => {
		const fetchFilms = async () => {
			const slugs = filmSlugsKey.split(",").filter(Boolean);
			if (slugs.length === 0) {
				setFilms([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const fetchedFilms = await searchFilmsBySlugs(slugs, 100);
				// Sort by order in filmSlugs
				const sortedFilms = slugs
					.map((slug) => fetchedFilms.find((f) => f.slug === slug))
					.filter((f): f is FilmItem => f !== undefined);
				setFilms(sortedFilms);
			} catch (error) {
				console.error("Failed to fetch films:", error);
				setFilms([]);
			} finally {
				setLoading(false);
			}
		};

		fetchFilms();
	}, [filmSlugsKey]);

	return (
		<div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<div className='bg-[#0f1014] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'>
				<div className='p-6'>
					<div className='flex items-center justify-between mb-6'>
						<div>
							<h3 className='text-xl font-bold text-white'>
								Quản lý phim - {card.title}
							</h3>
							<p className='text-sm text-gray-400 mt-1'>
								Đường dẫn:{" "}
								{card.href || `/danh-muc/${card._id}`}
							</p>
						</div>
						<button
							onClick={onClose}
							className='text-gray-400 hover:text-white'
						>
							<X className='h-6 w-6' />
						</button>
					</div>

					{/* Search Box */}
					<div className='mb-4'>
						<label className='block text-sm font-medium text-gray-300 mb-2'>
							Tìm kiếm phim để thêm
						</label>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
							<Input
								placeholder='Tìm kiếm phim...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500'
							/>
							{searching && (
								<div className='absolute right-3 top-1/2 -translate-y-1/2'>
									<div className='h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
								</div>
							)}
						</div>
					</div>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className='mb-4 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-black/30'>
							{searchResults
								.filter(
									(film) =>
										!currentCard.filmSlugs?.includes(
											film.slug,
										),
								)
								.map((film) => (
									<div
										key={film.slug}
										className='flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0'
										onClick={() => onAddFilm(film)}
									>
										<Image
											src={film.poster_url}
											alt={film.name}
											width={40}
											height={60}
											className='rounded object-cover'
											unoptimized
										/>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-white truncate'>
												{film.name}
											</p>
											<p className='text-xs text-gray-400'>
												{film.slug}
											</p>
										</div>
										<Plus className='h-4 w-4 text-primary' />
									</div>
								))}
						</div>
					)}

					{/* Selected Films */}
					<div className='mt-6'>
						<div className='flex items-center justify-between mb-3'>
							<label className='block text-sm font-medium text-gray-300'>
								Phim trong danh mục (
								{currentCard.filmSlugs?.length || 0})
							</label>
						</div>

						{loading ?
							<div className='text-center py-10'>
								<div className='h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto' />
								<p className='text-sm text-gray-400 mt-2'>
									Đang tải...
								</p>
							</div>
						: films.length === 0 ?
							<div className='text-center py-10 text-gray-500 text-sm rounded-lg border border-white/5 bg-white/5'>
								Chưa có phim nào. Tìm kiếm và thêm phim vào danh
								mục.
							</div>
						:	<div className='space-y-2 max-h-96 overflow-y-auto'>
								{films.map((film) => (
									<div
										key={film.slug}
										className='flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5'
									>
										<Image
											src={film.poster_url}
											alt={film.name}
											width={50}
											height={75}
											className='rounded object-cover'
											unoptimized
										/>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-white truncate'>
												{film.name}
											</p>
											<p className='text-xs text-gray-400'>
												{film.slug}
											</p>
										</div>
										<button
											onClick={() =>
												onRemoveFilm(film.slug)
											}
											className='text-red-400 hover:text-red-300'
										>
											<Trash2 className='h-4 w-4' />
										</button>
									</div>
								))}
							</div>
						}
					</div>

					{/* Close Button */}
					<div className='mt-6'>
						<Button
							onClick={onClose}
							className='w-full bg-primary hover:bg-primary/90 text-black font-semibold'
						>
							Đóng
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
