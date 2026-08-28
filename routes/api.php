<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnimalController;
use App\Http\Controllers\Api\BirthController;
use App\Http\Controllers\Api\BreedController;
use App\Http\Controllers\Api\BreedingCycleController;
use App\Http\Controllers\Api\FarmController;
use App\Http\Controllers\Api\HealthRecordController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\WeightController;
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
Route::middleware('throttle:6,1')->group(function () {
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Protected Routes (Require Sanctum Authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);

    // Farm management routes
    Route::get('/farm', [FarmController::class, 'show']);
    Route::put('/farm', [FarmController::class, 'update']);
    Route::get('/farm/statistics', [FarmController::class, 'statistics']);
    
    // Animal management routes
    Route::get('/animals', [AnimalController::class, 'index']);
    Route::post('/animals', [AnimalController::class, 'store']);
    Route::get('/animals/{id}', [AnimalController::class, 'show']);
    Route::put('/animals/{id}', [AnimalController::class, 'update']);
    Route::delete('/animals/{id}', [AnimalController::class, 'destroy']);
    Route::post('/animals/{id}/restore', [AnimalController::class, 'restore']);
    Route::post('/animals/{id}/exit', [AnimalController::class, 'recordExit']);
    Route::post('/animals/{id}/feed', [AnimalController::class, 'feed']);
    Route::post('/animals/{id}/groom', [AnimalController::class, 'groom']);
    Route::post('/animals/{id}/sacrifice', [AnimalController::class, 'sacrifice']);
    Route::get('/animals/{id}/weights', [WeightController::class, 'index']);
    Route::post('/animals/{id}/weights', [WeightController::class, 'store']);
    Route::put('/weights/{id}', [WeightController::class, 'update']);
    Route::delete('/weights/{id}', [WeightController::class, 'destroy']);

    // Breeds — lookup for the animal form's breed dropdown, plus
    // farm-scoped custom breed management.
    Route::get('/breeds', [BreedController::class, 'index']);
    Route::post('/breeds', [BreedController::class, 'store']);
    Route::put('/breeds/{id}', [BreedController::class, 'update']);
    Route::delete('/breeds/{id}', [BreedController::class, 'destroy']);

    // Breeding cycles
    Route::get('/animals/{id}/breeding-cycles', [BreedingCycleController::class, 'index']);
    Route::post('/animals/{id}/breeding-cycles', [BreedingCycleController::class, 'store']);
    Route::put('/breeding-cycles/{id}', [BreedingCycleController::class, 'update']);
    Route::delete('/breeding-cycles/{id}', [BreedingCycleController::class, 'destroy']);
    Route::post('/breeding-cycles/{id}/pregnancy-check', [BreedingCycleController::class, 'pregnancyCheck']);
    Route::post('/breeding-cycles/{id}/wean', [BreedingCycleController::class, 'wean']);

    // Births
    Route::get('/animals/{id}/births', [BirthController::class, 'index']);
    Route::post('/animals/{id}/births', [BirthController::class, 'store']);
    Route::put('/births/{id}', [BirthController::class, 'update']);
    Route::delete('/births/{id}', [BirthController::class, 'destroy']);

    // Health records
    Route::get('/animals/{id}/health-records', [HealthRecordController::class, 'index']);
    Route::post('/animals/{id}/health-records', [HealthRecordController::class, 'store']);
    Route::put('/health-records/{id}', [HealthRecordController::class, 'update']);
    Route::delete('/health-records/{id}', [HealthRecordController::class, 'destroy']);

    // Alerts (computed at read time, no scheduler)
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::post('/alerts/dismiss', [AlertController::class, 'dismiss']);

    // Inventory items + their append-only restock/consume ledger
    Route::get('/inventory-items', [InventoryController::class, 'index']);
    Route::post('/inventory-items', [InventoryController::class, 'store']);
    Route::put('/inventory-items/{id}', [InventoryController::class, 'update']);
    Route::delete('/inventory-items/{id}', [InventoryController::class, 'destroy']);
    Route::get('/inventory-items/{id}/transactions', [InventoryController::class, 'transactions']);
    Route::post('/inventory-items/{id}/transactions', [InventoryController::class, 'storeTransaction']);

    // Admin-only user management — see EnsureUserIsAdmin. Not farm-scoped:
    // an admin reviews registrations across the whole application.
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users/{id}/approve', [AdminUserController::class, 'approve']);
        Route::post('/users/{id}/reject', [AdminUserController::class, 'reject']);
        Route::post('/users/{id}/suspend', [AdminUserController::class, 'suspend']);
        Route::post('/users/{id}/reactivate', [AdminUserController::class, 'reactivate']);
    });
});