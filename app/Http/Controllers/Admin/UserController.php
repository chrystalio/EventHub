<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;


class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): \Inertia\Response
    {
        return Inertia::render('admin/users/index', [
            'users' => User::with('roles')->get(),
            'roles' => Role::pluck('name'),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->input('query');
        $excludedRoles = ['System Administrator', 'Akademik'];

        $userQuery = User::whereDoesntHave('roles', function ($query) use ($excludedRoles) {
            $query->whereIn('name', $excludedRoles);
        });

        if ($query) {
            $users = $userQuery->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                    ->orWhere('email', 'LIKE', "%{$query}%");
            })
                ->limit(10)
                ->get(['uuid', 'name', 'email']);
        } else {
            $users = $userQuery->latest()->limit(5)->get(['uuid', 'name', 'email']);
        }

        return response()->json($users);
    }

    public function updateRoles(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'roles' => ['array'],
            'roles.*' => ['exists:roles,name'],
        ]);

        $user->syncRoles($validated['roles'] ?? []);

        return back()->with('success', 'Roles updated successfully.');
    }
}
