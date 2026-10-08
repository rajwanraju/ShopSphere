<?php

namespace App\Http\Requests\StoreAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $storeId = $this->user()->store_id;

        return [
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')->where('store_id', $storeId),
            ],
            // New image uploads: validated by MIME/extension/size, never by
            // the original filename. Storage paths are server generated.
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            // Paths of previously uploaded images to keep on update. Every
            // path must belong to this product, preventing arbitrary paths.
            'existing_images' => ['nullable', 'array', 'max:5'],
            'existing_images.*' => ['string', 'max:255'],
        ];
    }
}
