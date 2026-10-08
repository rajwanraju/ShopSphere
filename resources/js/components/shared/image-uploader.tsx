import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_IMAGES = 5;

/**
 * Product image picker: keeps existing image paths, previews newly
 * selected files and enforces the backend's per-product image limit.
 */
export function ImageUploader({
    existingImages,
    onExistingChange,
    newFiles,
    onNewFilesChange,
}: {
    existingImages: string[];
    onExistingChange: (images: string[]) => void;
    newFiles: File[];
    onNewFilesChange: (files: File[]) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<Record<string, string>>({});

    const total = existingImages.length + newFiles.length;

    function addFiles(files: FileList | null) {
        if (!files) {
            return;
        }

        const accepted = Array.from(files).slice(0, MAX_IMAGES - total);
        const nextPreviews = { ...previews };

        accepted.forEach((file) => {
            nextPreviews[file.name] = URL.createObjectURL(file);
        });

        setPreviews(nextPreviews);
        onNewFilesChange([...newFiles, ...accepted]);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }

    function removeNewFile(file: File) {
        const url = previews[file.name];

        if (url) {
            URL.revokeObjectURL(url);

            const { [file.name]: _removed, ...rest } = previews;
            setPreviews(rest);
        }

        onNewFilesChange(newFiles.filter((candidate) => candidate !== file));
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
                {existingImages.map((path) => (
                    <div
                        key={path}
                        className="group relative size-24 overflow-hidden rounded-md border"
                    >
                        <img
                            src={`/storage/${path}`}
                            alt=""
                            className="size-full object-cover"
                        />
                        <button
                            type="button"
                            aria-label="Remove image"
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() =>
                                onExistingChange(
                                    existingImages.filter(
                                        (candidate) => candidate !== path,
                                    ),
                                )
                            }
                        >
                            <X className="size-5 text-white" />
                        </button>
                    </div>
                ))}

                {newFiles.map((file) => (
                    <div
                        key={file.name}
                        className="group relative size-24 overflow-hidden rounded-md border"
                    >
                        <img
                            src={previews[file.name]}
                            alt=""
                            className="size-full object-cover"
                        />
                        <button
                            type="button"
                            aria-label="Remove image"
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => removeNewFile(file)}
                        >
                            <X className="size-5 text-white" />
                        </button>
                    </div>
                ))}

                {total < MAX_IMAGES && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            'flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:bg-muted/50',
                        )}
                    >
                        <ImagePlus className="size-5" />
                        <span className="text-xs">
                            {total}/{MAX_IMAGES}
                        </span>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(event) => addFiles(event.target.files)}
            />
            <p className="text-xs text-muted-foreground">
                Up to {MAX_IMAGES} images per product. JPG, PNG or WebP.
            </p>
        </div>
    );
}
