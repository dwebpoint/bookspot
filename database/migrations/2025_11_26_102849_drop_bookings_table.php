<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('bookings');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate bookings table if rollback is needed
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timeslot_id')
                ->unique()
                ->constrained()
                ->onDelete('cascade');
            $table->foreignId('client_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->enum('status', ['confirmed', 'cancelled', 'completed'])
                ->default('confirmed');
            $table->timestamps();

            // Indexes
            $table->index('client_id');
            $table->index(['status', 'created_at']);
        });
    }
};
