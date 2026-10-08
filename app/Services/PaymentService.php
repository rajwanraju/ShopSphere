<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\User;
use App\Support\Enums\PaymentStatus;
use App\Support\Enums\SubscriptionStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    /**
     * Submit a manual payment for the store's pending subscription.
     * The paid amount is always taken from the subscription's package
     * snapshot, never from client input.
     *
     * @param  array<string, mixed>  $data
     */
    public function submit(Store $store, PaymentChannel $channel, array $data): Payment
    {
        $subscription = $store->subscription()->firstOrFail();

        if ($subscription->status !== SubscriptionStatus::Pending) {
            throw ValidationException::withMessages([
                'subscription' => 'Payment can only be submitted while the subscription is pending.',
            ]);
        }

        return DB::transaction(function () use ($store, $subscription, $channel, $data): Payment {
            return Payment::create([
                'store_id' => $store->id,
                'subscription_id' => $subscription->id,
                'payment_channel_id' => $channel->id,
                'channel_name' => $channel->name,
                'account_number' => $data['account_number'],
                'transaction_id' => $data['transaction_id'],
                'amount' => $subscription->package_price,
                'status' => PaymentStatus::Pending,
            ]);
        });
    }

    /**
     * Approve or reject a pending payment. Approval activates the
     * subscription for the package duration; rejection leaves the
     * subscription untouched (still pending).
     */
    public function verify(User $manager, Payment $payment, PaymentStatus $status, ?string $rejectionReason = null): Payment
    {
        if ($payment->status !== PaymentStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => 'This payment has already been processed.',
            ]);
        }

        return DB::transaction(function () use ($manager, $payment, $status, $rejectionReason): Payment {
            $payment->update([
                'status' => $status,
                'rejection_reason' => $status === PaymentStatus::Rejected ? $rejectionReason : null,
                'verified_by' => $manager->id,
                'verified_at' => now(),
            ]);

            if ($status === PaymentStatus::Approved) {
                $this->activateSubscription($payment->subscription);
            }

            return $payment->refresh();
        });
    }

    private function activateSubscription(Subscription $subscription): void
    {
        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addDays($subscription->package_duration_days),
        ]);
    }
}
