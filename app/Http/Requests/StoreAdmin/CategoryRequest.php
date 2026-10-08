<?php

namespace App\Http\Requests\StoreAdmin;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
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

        $unique = Rule::unique('categories', 'title')->where('store_id', $storeId);

        if ($category = $this->route('category')) {
            assert($category instanceof Category);

            $unique->ignore($category->id);
        }

        return [
            'title' => ['required', 'string', 'max:100', $unique],
        ];
    }
}
