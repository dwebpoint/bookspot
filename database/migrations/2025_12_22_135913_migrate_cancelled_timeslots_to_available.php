<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert all existing cancelled timeslots to available status
        DB::table('timeslots')
            ->where('status', 'cancelled')
            ->update(['status' => 'available']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No way to reliably reverse this migration
        // as we don't know which timeslots were originally cancelled
    }
};
