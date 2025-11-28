<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if client_id column exists before adding
        if (! Schema::hasColumn('timeslots', 'client_id')) {
            Schema::table('timeslots', function (Blueprint $table) {
                $table->foreignId('client_id')
                    ->nullable()
                    ->after('provider_id')
                    ->constrained('users')
                    ->onDelete('set null');

                $table->index('client_id');
            });
        }

        // Add composite index if it doesn't exist
        $indexes = DB::select("SHOW INDEX FROM timeslots WHERE Key_name = 'timeslots_status_start_time_index'");
        if (empty($indexes)) {
            Schema::table('timeslots', function (Blueprint $table) {
                $table->index(['status', 'start_time']);
            });
        }

        // Modify status enum to add 'completed' value
        DB::statement("ALTER TABLE timeslots MODIFY COLUMN status ENUM('available', 'booked', 'cancelled', 'completed') NOT NULL DEFAULT 'available'");

        // Migrate data from bookings to timeslots
        $this->migrateBookingData();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore status enum to original values
        DB::statement("ALTER TABLE timeslots MODIFY COLUMN status ENUM('available', 'booked', 'cancelled') NOT NULL DEFAULT 'available'");

        // Remove indexes
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropIndex(['timeslots_client_id_index']);
            $table->dropIndex(['timeslots_status_start_time_index']);
        });

        // Drop the foreign key constraint first
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
        });

        // Drop columns
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropColumn('client_id');
        });
    }

    /**
     * Migrate existing booking data to timeslots.
     */
    private function migrateBookingData(): void
    {
        // Get all bookings with their status
        $bookings = DB::table('bookings')->get();

        foreach ($bookings as $booking) {
            // Determine the timeslot status based on booking status
            $status = match ($booking->status) {
                'confirmed' => 'booked',
                'cancelled' => 'cancelled',
                'completed' => 'completed',
                default => 'available',
            };

            // Update the timeslot with client_id and status
            DB::table('timeslots')
                ->where('id', $booking->timeslot_id)
                ->update([
                    'client_id' => $booking->client_id,
                    'status' => $status,
                    'updated_at' => now(),
                ]);
        }

        // Set remaining timeslots (those without bookings) to 'available'
        DB::table('timeslots')
            ->whereNull('status')
            ->orWhere('status', '')
            ->update([
                'status' => 'available',
                'updated_at' => now(),
            ]);
    }
};
