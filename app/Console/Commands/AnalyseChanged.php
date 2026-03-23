<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class AnalyseChanged extends Command
{
    protected $signature = 'phpstan:changed';

    protected $description = 'Run PHPStan on changed PHP files only';

    public function handle(): int
    {
        $process = new Process(
            ['git', 'diff', '--name-only', '--diff-filter=d', 'HEAD', '--', '*.php'],
        );
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error('Failed to run git diff.');

            return Command::FAILURE;
        }

        $output = trim($process->getOutput());

        if ($output === '') {
            $this->info('No changed PHP files to analyse.');

            return Command::SUCCESS;
        }

        $files = array_filter(
            preg_split('/\R/', $output),
            fn (string $f): bool => str_starts_with(trim($f), 'app/') || str_starts_with(trim($f), 'database/'),
        );
        $files = array_map('trim', $files);

        if ($files === []) {
            $this->info('No changed PHP files to analyse.');

            return Command::SUCCESS;
        }

        $this->info('Analysing '.count($files).' changed file(s):');
        foreach ($files as $file) {
            $this->line("  - {$file}");
        }

        $fileArgs = implode(' ', array_map('escapeshellarg', $files));
        $phpstan = PHP_OS_FAMILY === 'Windows'
            ? 'php vendor/phpstan/phpstan/phpstan.phar'
            : 'vendor/bin/phpstan';

        $exitCode = 0;
        passthru("{$phpstan} analyse --no-progress {$fileArgs}", $exitCode);

        return $exitCode === 0 ? Command::SUCCESS : Command::FAILURE;
    }
}
