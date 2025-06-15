<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;

class MakePermission extends Command
{
    /**
     * The name and signature of the console command.
     *
     * Usage examples:
     *   # Single permission:
     *   php artisan make:permission "App\Http\Controllers\Admin\FooController@update" "Admin - Update Foo"
     *
     *   # CRUD bundle (no @method given):
     *   php artisan make:permission "App\Http\Controllers\Admin\FooController" "Admin - Foo"
     *
     * Options:
     *  --guard= : (optional) guard name (defaults to auth.defaults.guard)
     */
    protected $signature = 'make:permission
        { name               : Either “Controller@method” or just a controller class (no @) }
        { shortname?         : Human‐friendly label (e.g. “Admin - Foo”). If omitted, auto‐derived. }
        { --guard=           : Which guard to use; defaults to config("auth.defaults.guard") }';

    /** The console command description. */
    protected $description = 'Create permission(s) using "Controller@method" or CRUD for a controller class.';

    public function getHelp(): string
    {
        return <<<HELP
        Examples:

          # Create a single permission:
          php artisan make:permission "App\\Http\\Controllers\\Admin\\UserController@update"

          # Create all CRUD permissions:
          php artisan make:permission "App\\Http\\Controllers\\Admin\\UserController"

          Options:
            --guard     Specify a guard name (defaults to config('auth.defaults.guard'))
            shortname   Optional display label. If omitted, it will be auto-generated.
        HELP;
    }


    public function handle()
    {
        $rawName     = trim($this->argument('name'));
        $shortname   = $this->argument('shortname');
        $guard       = $this->option('guard') ?: config('auth.defaults.guard');

        // If a shortname was not provided, generate one from the base name:
        if (! $shortname) {
            // Derive “shortname” from the class name without namespace or “Controller” suffix.
            // e.g. “App\Http\Controllers\Admin\FooController” or “…@update” → “Foo”
            $onlyClass = $rawName;
            if (str_contains($rawName, '@')) {
                // strip off @method if present
                $onlyClass = strstr($rawName, '@', true);
            }
            $basename = last(explode('\\', $onlyClass)); // e.g. “FooController”
            $basename = str_replace('Controller', '', $basename); // → “Foo”

            // If user passed a “Controller@method” name, also include the action in the short label:
            if (str_contains($rawName, '@')) {
                $action = explode('@', $rawName)[1];
                $shortname = ucfirst($action) . ' ' . $basename;
            } else {
                // If it’s a bare controller, just use the resource name:
                $shortname = $basename;
            }
        }

        // If “name” contains an @, create exactly one permission. Otherwise, create the four CRUD‐style ones.
        if (str_contains($rawName, '@')) {
            // (A) Single permission case:
            $this->createOrWarn($rawName, $shortname, $guard);
        } else {
            // (B) CRUD bundle case → create @view, @create, @update, @delete
            $methods = [ 'view', 'create', 'update', 'delete' ];
            foreach ($methods as $method) {
                $resource = strtolower(class_basename(str_replace('Controller', '', $rawName)));
                $fullName = $resource . '.' . $method;
                $this->createOrWarn($fullName, $shortname, $guard);
            }
        }

        return 0;
    }

    /**
     * Create a permission if it does not already exist, otherwise warn that it’s already there.
     */
    protected function createOrWarn(string $name, string $shortname, string $guard): void
    {
        $permission = Permission::firstOrCreate(
            [ 'name' => $name, 'guard_name' => $guard ],
            [ 'shortname' => $shortname ]
        );

        if ($permission->wasRecentlyCreated) {
            $this->info("✅ Created: [{$permission->id}] {$permission->name}  (shortname: “{$permission->shortname}”)");
        } else {
            $this->warn("⚠️ Already exists: [{$permission->id}] {$permission->name} (shortname: “{$permission->shortname}”)");
        }
    }
}
