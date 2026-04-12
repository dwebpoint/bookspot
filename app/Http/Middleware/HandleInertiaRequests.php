<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->getRoleNames()->first(),
                    'timezone' => $request->user()->timezone,
                    'email_notifications_enabled' => $request->user()->email_notifications_enabled,
                    'clients_count' => $request->user()->isServiceProvider() || $request->user()->isAdmin()
                        ? $request->user()->clients()->count()
                        : null,
                    'providers_count' => $request->user()->isClient()
                        ? $request->user()->providers()->count()
                        : null,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => $request->user() && ($request->user()->isServiceProvider() || $request->user()->isAdmin())
                ? $request->user()->unreadNotifications()->latest()->take(20)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'data' => $n->data,
                    'created_at' => $n->created_at->toIso8601String(),
                ])->values()->all()
                : [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'commitHash' => $request->user()?->isAdmin() ? $this->getCommitHash() : null,
        ];
    }

    private function getCommitHash(): ?string
    {
        $hash = config('app.commit_hash');

        if ($hash) {
            return $hash;
        }

        $path = base_path('.git/HEAD');
        if (! file_exists($path)) {
            return null;
        }

        $head = trim(file_get_contents($path));
        if (str_starts_with($head, 'ref: ')) {
            $refPath = base_path('.git/'.substr($head, 5));

            return file_exists($refPath) ? substr(trim(file_get_contents($refPath)), 0, 8) : null;
        }

        return substr($head, 0, 8);
    }
}
