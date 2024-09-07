export interface TileLayer {
    url: string;
    options?: {
        maxZoom?: number;
        minZoom?: number;
        attribution?: string;
    };
}
