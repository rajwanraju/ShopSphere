<?php

namespace App\Http\Controllers\Api\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\PaymentDecisionRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Support\Enums\PaymentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Payment::query()
            ->with(['store:id,name,slug', 'subscription:id,package_name,status'])
            ->orderByDesc('created_at');

        $status = $request->query('status');

        if (is_string($status) && $status !== '') {
            $query->where('status', $status);
        }

        return PaymentResource::collection($query->paginate(15)->withQueryString());
    }

    public function show(Payment $payment): PaymentResource
    {
        $this->authorize('view', $payment);

        return new PaymentResource($payment->loadMissing(['store:id,name,slug', 'subscription:id,package_name,status']));
    }

    /**
     * Approve a pending payment; activates the subscription.
     */
    public function approve(Request $request, Payment $payment): PaymentResource
    {
        $this->authorize('update', $payment);

        return $this->decide($request, $payment, PaymentStatus::Approved, null);
    }

    /**
     * Reject a pending payment; subscription stays inactive.
     */
    public function reject(PaymentDecisionRequest $request, Payment $payment): PaymentResource
    {
        $this->authorize('update', $payment);

        return $this->decide($request, $payment, PaymentStatus::Rejected, $request->input('rejection_reason'));
    }

    private function decide(Request $request, Payment $payment, PaymentStatus $status, ?string $reason): PaymentResource
    {
        $manager = $request->user();

        try {
            $payment = $this->payments->verify($manager, $payment, $status, $reason);
        } catch (ValidationException $e) {
            Log::warning('Payment verification rejected by state check', [
                'payment_id' => $payment->id,
                'manager_id' => $manager->id,
                'reason' => $e->getMessage(),
            ]);

            throw $e;
        }

        Log::info('Manual payment processed', [
            'payment_id' => $payment->id,
            'status' => $status->value,
            'manager_id' => $manager->id,
        ]);

        return new PaymentResource($payment);
    }
}
