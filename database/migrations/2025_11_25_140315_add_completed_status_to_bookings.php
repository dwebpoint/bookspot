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
        // SQLite doesn't support modifying enum directly, so we recreate the column
        Schema::table('bookings', function (Blueprint $table) {
            // Drop the index first (SQLite requirement)
            $table->dropIndex('bookings_status_created_at_index');

            // Create new column with updated enum
            $table->enum('status_new', ['confirmed', 'cancelled', 'completed'])
                ->default('confirmed')
                ->after('status');
        });

        // Copy data from old column to new column
        DB::statement('UPDATE bookings SET status_new = status');

        Schema::table('bookings', function (Blueprint $table) {
            // Drop old column
            $table->dropColumn('status');
        });

        Schema::table('bookings', function (Blueprint $table) {
            // Rename new column to original name
            $table->renameColumn('status_new', 'status');

            // Recreate the index
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert completed bookings to confirmed before rollback
        DB::statement("UPDATE bookings SET status = 'confirmed' WHERE status = 'completed'");

        // Recreate column with original enum
        Schema::table('bookings', function (Blueprint $table) {
            // Drop the index first (SQLite requirement)
            $table->dropIndex('bookings_status_created_at_index');

            $table->enum('status_new', ['confirmed', 'cancelled'])
                ->default('confirmed')
                ->after('status');
        });

        DB::statement('UPDATE bookings SET status_new = status');

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');

            // Recreate the index
            $table->index(['status', 'created_at']);
        });
    }
};
