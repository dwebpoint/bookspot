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
        Schema::create('provider_client', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->foreignId('client_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->boolean('created_by_provider')->default(true);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            
            // Unique constraint to prevent duplicate relationships
            $table->unique(['provider_id', 'client_id']);
            
            // Indexes for performance
            $table->index('provider_id');
            $table->index('client_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provider_client');
    }
};
