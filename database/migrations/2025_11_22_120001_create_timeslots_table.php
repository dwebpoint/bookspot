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
        Schema::create('timeslots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->dateTime('start_time');
            $table->unsignedInteger('duration_minutes');
            $table->timestamps();

            // Indexes for performance
            $table->index(['provider_id', 'start_time']);
            $table->index('start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timeslots');
    }
};
