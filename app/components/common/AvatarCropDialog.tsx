"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface AvatarCropDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (base64: string) => Promise<void>;
    currentAvatar?: string;
}

const MAX_OUTPUT_SIZE = 512; // Output size in pixels
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const QUALITY = 0.85;

export function AvatarCropDialog({ isOpen, onClose, onSave, currentAvatar }: AvatarCropDialogProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Crop state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageNaturalSize, setImageNaturalSize] = useState({ w: 0, h: 0 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const CROP_SIZE = 280; // Crop area size in pixels (display)

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setImageSrc(null);
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setError(null);
            setIsSaving(false);
        }
    }, [isOpen]);

    const loadImage = useCallback((file: File) => {
        setError(null);

        if (!file.type.startsWith("image/")) {
            setError("Vui lòng chọn file ảnh (JPG, PNG, WEBP)");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError("Ảnh quá lớn. Tối đa 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            const img = new window.Image();
            img.onload = () => {
                imageRef.current = img;
                setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                setImageSrc(result);
                setScale(1);
                setPosition({ x: 0, y: 0 });
            };
            img.src = result;
        };
        reader.readAsDataURL(file);
    }, []);

    // Drag and Drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            loadImage(files[0]);
        }
    }, [loadImage]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            loadImage(files[0]);
        }
        // Reset input value so the same file can be selected again
        e.target.value = "";
    }, [loadImage]);

    // Image panning handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!imageSrc) return;
        e.preventDefault();
        setIsDraggingImage(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [imageSrc, position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDraggingImage) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [isDraggingImage, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDraggingImage(false);
    }, []);

    // Touch handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!imageSrc || e.touches.length !== 1) return;
        const touch = e.touches[0];
        setIsDraggingImage(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }, [imageSrc, position]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDraggingImage || e.touches.length !== 1) return;
        e.preventDefault();
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y,
        });
    }, [isDraggingImage, dragStart]);

    const handleTouchEnd = useCallback(() => {
        setIsDraggingImage(false);
    }, []);

    // Zoom via mouse wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }, []);

    const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
    const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Crop and compress
    const handleSave = useCallback(async () => {
        if (!imageRef.current || !imageSrc) return;

        setIsSaving(true);
        setError(null);

        try {
            const canvas = document.createElement("canvas");
            canvas.width = MAX_OUTPUT_SIZE;
            canvas.height = MAX_OUTPUT_SIZE;
            const ctx = canvas.getContext("2d")!;

            const img = imageRef.current;

            // Calculate how the image is displayed in the crop area
            const minDim = Math.min(img.naturalWidth, img.naturalHeight);
            const displayScale = CROP_SIZE / minDim;
            const displayW = img.naturalWidth * displayScale * scale;
            const displayH = img.naturalHeight * displayScale * scale;

            // The crop area is centered in the container
            // position is the offset of the image center from the crop center
            const cropCenterX = CROP_SIZE / 2;
            const cropCenterY = CROP_SIZE / 2;

            // Image is drawn at:
            const imgDisplayX = cropCenterX - displayW / 2 + position.x;
            const imgDisplayY = cropCenterY - displayH / 2 + position.y;

            // Map crop area back to source image coordinates
            const srcX = (0 - imgDisplayX) / displayW * img.naturalWidth;
            const srcY = (0 - imgDisplayY) / displayH * img.naturalHeight;
            const srcW = CROP_SIZE / displayW * img.naturalWidth;
            const srcH = CROP_SIZE / displayH * img.naturalHeight;

            // Draw with anti-aliasing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, MAX_OUTPUT_SIZE, MAX_OUTPUT_SIZE);

            // Convert to JPEG base64 for compression
            const base64 = canvas.toDataURL("image/webp", QUALITY);

            await onSave(base64);
            onClose();
        } catch (err) {
            console.error("Failed to crop/save avatar:", err);
            setError("Không thể xử lý ảnh. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    }, [imageSrc, scale, position, onSave, onClose]);

    // Draw preview
    useEffect(() => {
        if (!imageSrc || !imageRef.current || !previewCanvasRef.current) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext("2d")!;
        const img = imageRef.current;

        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const displayScale = CROP_SIZE / minDim;
        const displayW = img.naturalWidth * displayScale * scale;
        const displayH = img.naturalHeight * displayScale * scale;

        const drawX = (CROP_SIZE - displayW) / 2 + position.x;
        const drawY = (CROP_SIZE - displayH) / 2 + position.y;

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, drawX, drawY, displayW, displayH);
        ctx.restore();

        // Draw circle border
        ctx.strokeStyle = "rgba(138, 228, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
    }, [imageSrc, scale, position]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={!isSaving ? onClose : undefined}
            />

            {/* Dialog */}
            <div className="relative bg-[#12121f] border border-white/10 rounded-2xl shadow-2xl w-[95vw] max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#8ae4ff]" />
                        <h2 className="text-white font-semibold text-base">Thay đổi ảnh đại diện</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {!imageSrc ? (
                        /* Upload Zone */
                        <div
                            className={`
                                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                                ${isDragging
                                    ? "border-[#8ae4ff] bg-[#8ae4ff]/5 scale-[1.02]"
                                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                                }
                            `}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center gap-3">
                                {/* Current avatar preview */}
                                {currentAvatar ? (
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 mb-2">
                                        <img src={currentAvatar} alt="Current" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                        <ImageIcon className="w-8 h-8 text-gray-600" />
                                    </div>
                                )}

                                <Upload className={`w-8 h-8 ${isDragging ? "text-[#8ae4ff]" : "text-gray-500"} transition-colors`} />
                                <div>
                                    <p className="text-white text-sm font-medium">
                                        {isDragging ? "Thả ảnh vào đây" : "Kéo thả ảnh hoặc nhấn để chọn"}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        JPG, PNG, WEBP • Tối đa 5MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Crop Area */
                        <div className="flex flex-col items-center gap-4">
                            {/* Preview Canvas */}
                            <div
                                ref={containerRef}
                                className="relative select-none overflow-hidden rounded-full bg-black/50"
                                style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: "none" }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onWheel={handleWheel}
                            >
                                <canvas
                                    ref={previewCanvasRef}
                                    width={CROP_SIZE}
                                    height={CROP_SIZE}
                                    className="w-full h-full cursor-grab active:cursor-grabbing"
                                />
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3 w-full justify-center">
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title="Thu nhỏ"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>

                                {/* Zoom slider */}
                                <div className="flex-1 max-w-[160px]">
                                    <input
                                        type="range"
                                        min="50"
                                        max="300"
                                        value={scale * 100}
                                        onChange={(e) => setScale(parseInt(e.target.value) / 100)}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                                            [&::-webkit-slider-thumb]:appearance-none
                                            [&::-webkit-slider-thumb]:w-4
                                            [&::-webkit-slider-thumb]:h-4
                                            [&::-webkit-slider-thumb]:rounded-full
                                            [&::-webkit-slider-thumb]:bg-[#8ae4ff]
                                            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(138,228,255,0.4)]
                                            [&::-webkit-slider-thumb]:cursor-pointer
                                        "
                                    />
                                </div>

                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title="Phóng to"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={handleReset}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title="Đặt lại"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-gray-500 text-xs text-center">
                                Kéo ảnh để điều chỉnh vị trí • Cuộn chuột để zoom
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/5">
                    {imageSrc ? (
                        <>
                            <Button
                                onClick={() => {
                                    setImageSrc(null);
                                    setScale(1);
                                    setPosition({ x: 0, y: 0 });
                                }}
                                variant="outline"
                                disabled={isSaving}
                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-full px-4 h-9 cursor-pointer"
                            >
                                Chọn ảnh khác
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#8ae4ff] hover:bg-[#8ae4ff]/90 text-black rounded-full px-6 h-9 font-semibold text-xs gap-1.5 cursor-pointer"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        Lưu ảnh đại diện
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <div className="w-full flex justify-end">
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-full px-4 h-9 cursor-pointer"
                            >
                                Huỷ
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
