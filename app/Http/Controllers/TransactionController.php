<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Midtrans\Config;
use Midtrans\Snap;
use Inertia\Inertia;
use Inertia\Response;
use Midtrans\Notification;

class TransactionController extends Controller
{
    public function __construct()
    {
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = config('services.midtrans.is_3ds');
    }

    public function show(string $order_id): Response
    {
        $transaction = Transaction::where('order_id', $order_id)->with(['event', 'user'])->firstOrFail();

        if ($transaction->user_uuid !== auth()->user()->uuid) {
            abort(403, 'This is not your transaction.');
        }

        if ($transaction->status !== 'pending') {
            return Inertia::render('authenticated/transactions/show', [
                'transaction' => $transaction,
                'snapToken' => null,
                'errors' => ['payment' => 'This transaction is already completed or has expired.'],
            ]);
        }

        $params = [
            'transaction_details' => [
                'order_id' => $transaction->order_id,
                'gross_amount' => $transaction->total_amount,
            ],
            'customer_details' => [
                'first_name' => $transaction->user->name,
                'email' => $transaction->user->email,
                'phone' => $transaction->user->phone,
            ],
        ];

        $snapToken = Snap::getSnapToken($params);

        return Inertia::render('authenticated/transactions/show', [
            'transaction' => $transaction,
            'snapToken' => $snapToken,
        ]);
    }

    public function webhook(Request $request): ?JsonResponse
    {
        try {
            $notification = new Notification();

            $orderId = $notification->order_id;
            $transactionStatus = $notification->transaction_status;
            $fraudStatus = $notification->fraud_status;

            $transaction = Transaction::where('order_id', $orderId)->first();

            if (!$transaction) {
                return response()->json(['message' => 'Transaction not found.'], 404);
            }

            if ($transaction->status !== 'pending') {
                return response()->json(['message' => 'Transaction already processed.']);
            }

            if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
                if ($fraudStatus === 'accept') {
                    DB::transaction(function () use ($transaction, $notification) {
                        $transaction->update([
                            'status' => 'paid',
                            'transaction_id' => $notification->transaction_id,
                            'payment_details' => $notification->getResponse(),
                        ]);


                        Registration::where('order_id', $transaction->order_id)
                            ->update(['status' => 'approved']);
                    });
                }
            } else if ($transactionStatus === 'pending') {

            } else if ($transactionStatus === 'deny' || $transactionStatus === 'expire' || $transactionStatus === 'cancel') {

                $transaction->update(['status' => 'failed']);
            }

            return response()->json(['message' => 'Webhook processed successfully.']);

        } catch (\Exception $e) {
            report($e);
            return response()->json(['message' => 'Error processing webhook.'], 500);
        }
    }
}
