<?php

namespace App\Http\Requests\Management;

use Illuminate\Foundation\Http\FormRequest;

class PackageRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
