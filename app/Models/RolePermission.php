<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $table = 'role_permissions';

    protected $fillable = [
        'role',
        'permission',
        'is_granted',
    ];

    protected $casts = [
        'is_granted' => 'boolean',
    ];

    /**
     * Check if a given role is granted a specific permission.
     */
    public static function isGranted(string $role, string $permission): bool
    {
        $record = static::where('role', $role)->where('permission', $permission)->first();
        if ($record !== null) {
            return (bool) $record->is_granted;
        }

        // Default: only admin is granted account_deletion if not explicitly set
        if ($permission === 'account_deletion') {
            return $role === 'admin';
        }

        return false;
    }

    /**
     * Set a permission grant status for a role.
     */
    public static function setGrant(string $role, string $permission, bool $isGranted): self
    {
        return static::updateOrCreate(
            ['role' => $role, 'permission' => $permission],
            ['is_granted' => $isGranted]
        );
    }
}
