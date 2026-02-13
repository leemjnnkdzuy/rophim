
export interface Movie {
    id: string | number;
    title: string;
    originalTitle: string;
    year: number;
    rating: number;
    quality: string;
    episode?: string;
    poster: string;
    genre: string[];
    duration: string;
    views: string;
    isNew?: boolean;
    isTrending?: boolean;
    language?: string;
    description?: string;
    backdrop?: string;
}

export interface FeaturedMovie extends Movie {
    description: string;
    backdrop: string;
}
