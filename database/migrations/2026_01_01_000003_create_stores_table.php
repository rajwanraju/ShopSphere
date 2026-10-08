<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('status', 16)->default('ACTIVE')->index();
            $table->timestamps();
        });

        // users.store_id lives in the framework's users migration, which
        // runs before this table exists; attach the FK here.
        Schema::table('users', function (Blueprint $table): void {
            $table->foreign('store_id')
                ->references('id')
                ->on('stores')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['store_id']);
        });

        Schema::dropIfExists('stores');
    }
};
