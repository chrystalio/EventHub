<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRolePermissionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    public function index(Role $role): JsonResponse
    {
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return response()->json([
            'role' => $role,
            'permissions' => $permissions,
            'assigned' => $role->permissions->pluck('name'),
        ]);

    }


    public function update(UpdateRolePermissionRequest $request, Role $role): RedirectResponse
    {
        $role->syncPermissions($request->permissions ?? []);

        return back()->with('success', 'Permissions updated.');
    }
}
