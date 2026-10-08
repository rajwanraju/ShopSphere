<?php

namespace App\Http\Controllers\Api\StoreAdmin;

use App\Http\Controllers\Controller;
use App\Services\SalesReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private SalesReportService $reports) {}

    /**
     * Sales summary for the current store, strictly tenant scoped.
     */
    public function sales(Request $request): JsonResponse
    {
        $store = $request->user()->store()->firstOrFail();

        $days = in_array((int) $request->query('days', '30'), [7, 30, 90], true)
            ? (int) $request->query('days', '30')
            : 30;

        return response()->json([
            'data' => $this->reports->summary($store, $days),
        ]);
    }
}
