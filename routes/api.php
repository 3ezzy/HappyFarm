<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnimalController;
use App\Http\Controllers\Api\FarmController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Authentication Routes (Public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Require Sanctum Authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Farm management routes
    Route::get('/farm', [FarmController::class, 'show']);
    Route::get('/farm/statistics', [FarmController::class, 'statistics']);
    
    // Animal management routes
    Route::get('/animals', [AnimalController::class, 'index']);
    Route::post('/animals', [AnimalController::class, 'store']);
    Route::get('/animals/{id}', [AnimalController::class, 'show']);
    Route::post('/animals/{id}/feed', [AnimalController::class, 'feed']);
    Route::post('/animals/{id}/groom', [AnimalController::class, 'groom']);
    Route::post('/animals/{id}/sacrifice', [AnimalController::class, 'sacrifice']);
}); 