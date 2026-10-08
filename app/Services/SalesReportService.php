<?php

namespace App\Services;

use App\Models\Store;
use App\Support\StoreCache;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SalesReportService
{
    private const VALID_PERIODS = [7, 30, 90];

    /**
     * Sales summary for the store over the given period, cached per
     * store + period. Every query is strictly scoped to the store.
     *
     * @return array<string, mixed>
     */
    public function summary(Store $store, int $days): array
    {
        $days = in_array($days, self::VALID_PERIODS, true) ? $days : 30;

        $key = StoreCache::catalogKey($store->id, "sales-report:{$days}");

        return StoreCache::remember($key, 300, function () use ($store, $days): array {
            $from = Carbon::now()->subDays($days)->startOfDay();

            $base = DB::table('orders')
                ->where('store_id', $store->id)
                ->whereIn('status', ['PENDING', 'PROCESSING', 'COMPLETED'])
                ->where('created_at', '>=', $from);

            $totals = (clone $base)->selectRaw('COUNT(*) as orders_count, COALESCE(SUM(total), 0) as revenue')->first();

            $daily = (clone $base)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as orders_count, COALESCE(SUM(total), 0) as revenue')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get();

            $topProducts = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.store_id', $store->id)
                ->whereIn('orders.status', ['PENDING', 'PROCESSING', 'COMPLETED'])
                ->where('orders.created_at', '>=', $from)
                ->groupBy('order_items.product_title')
                ->selectRaw('order_items.product_title, SUM(order_items.quantity) as quantity_sold, COALESCE(SUM(order_items.subtotal), 0) as revenue')
                ->orderByDesc('quantity_sold')
                ->limit(5)
                ->get();

            return [
                'period_days' => $days,
                'orders_count' => (int) ($totals->orders_count ?? 0),
                'revenue' => (float) ($totals->revenue ?? 0),
                'daily' => $daily->map(fn ($row): array => [
                    'date' => (string) $row->date,
                    'orders_count' => (int) $row->orders_count,
                    'revenue' => (float) $row->revenue,
                ])->all(),
                'top_products' => $topProducts->map(fn ($row): array => [
                    'product_title' => (string) $row->product_title,
                    'quantity_sold' => (int) $row->quantity_sold,
                    'revenue' => (float) $row->revenue,
                ])->all(),
            ];
        });
    }
}
