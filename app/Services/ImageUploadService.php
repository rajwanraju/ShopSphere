<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ImageUploadService
{
    private const MAX_IMAGES = 5;

    /**
     * Store uploaded product images under a per-store directory. Files
     * are renamed with server-generated hashes; original filenames are
     * never used.
     *
     * @param  array<int, UploadedFile>  $files
     * @return array<int, string> Stored paths (relative to the public disk)
     */
    public function storeProductImages(array $files, int $storeId): array
    {
        $paths = [];

        foreach ($files as $file) {
            if (! $file->isValid()) {
                throw ValidationException::withMessages([
                    'images' => 'One of the uploaded files is invalid.',
                ]);
            }

            $path = $file->store("products/{$storeId}", 'public');

            if ($path === false) {
                throw ValidationException::withMessages([
                    'images' => 'The image could not be stored. Please try again.',
                ]);
            }

            $paths[] = $path;
        }

        return $paths;
    }

    /**
     * Delete image paths from storage, ignoring missing files.
     *
     * @param  array<int, mixed>  $paths
     */
    public function deleteImages(array $paths): void
    {
        foreach ($paths as $path) {
            if (is_string($path) && $path !== '') {
                Storage::disk('public')->delete($path);
            }
        }
    }

    /**
     * Keep only retained paths that actually belong to the product,
     * preventing arbitrary storage paths from being injected.
     *
     * @param  array<int, mixed>  $retained
     * @return array<int, string>
     */
    public function filterRetained(Product $product, array $retained): array
    {
        $known = $product->images ?? [];

        return collect($retained)
            ->filter(fn ($path): bool => is_string($path) && in_array($path, $known, true))
            ->values()
            ->all();
    }

    /**
     * Resolve the final image list for an update: retained existing
     * paths (already validated against the product) plus new uploads.
     *
     * @param  array<int, string>  $retained
     * @param  array<int, UploadedFile>  $uploads
     * @return array<int, string>
     */
    public function mergeImages(array $retained, array $uploads, int $storeId): array
    {
        $merged = [...array_values($retained), ...$this->storeProductImages($uploads, $storeId)];

        if (count($merged) > self::MAX_IMAGES) {
            throw ValidationException::withMessages([
                'images' => 'A product can have at most '.self::MAX_IMAGES.' images.',
            ]);
        }

        return $merged;
    }
}
