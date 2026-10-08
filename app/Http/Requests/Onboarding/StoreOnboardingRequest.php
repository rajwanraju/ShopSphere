<?php

namespace App\Http\Requests\Onboarding;

use App\Concerns\PasswordValidationRules;
use App\Models\Package;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOnboardingRequest extends FormRequest
{
    use PasswordValidationRules;

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
            'package_id' => ['required', 'integer', Rule::exists('packages', 'id')->where('is_active', true)],
            'store_name' => ['required', 'string', 'max:100'],
            'store_description' => ['nullable', 'string', 'max:500'],
            'owner_name' => ['required', 'string', 'max:100'],
            'owner_email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'owner_password' => $this->passwordRules(),
        ];
    }

    public function selectedPackage(): Package
    {
        /** @var Package $package */
        $package = Package::query()->findOrFail($this->integer('package_id'));

        return $package;
    }
}
