<?php

namespace Tests\Feature;

use App\Models\AlertDismissal;
use App\Models\Farm;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private function farmOwner(): array
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        return [$user, $farm];
    }

    private function item(Farm $farm, array $overrides = []): InventoryItem
    {
        return InventoryItem::create(array_merge([
            'farm_id' => $farm->id,
            'name' => 'Sheep Feed',
            'unit' => 'kg',
        ], $overrides));
    }

    // ------------------------------------------------------------
    // Item CRUD + farm scoping
    // ------------------------------------------------------------

    public function test_an_item_can_be_created()
    {
        [$user, $farm] = $this->farmOwner();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/inventory-items', [
            'name' => 'Sheep Feed', 'unit' => 'kg', 'low_stock_threshold' => 10,
        ]);

        $response->assertStatus(201)->assertJson(['name' => 'Sheep Feed', 'unit' => 'kg', 'current_stock' => 0]);
        $this->assertDatabaseHas('inventory_items', ['farm_id' => $farm->id, 'name' => 'Sheep Feed']);
    }

    public function test_duplicate_item_name_for_the_same_farm_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $this->item($farm, ['name' => 'Sheep Feed']);

        $this->actingAs($user, 'sanctum')->postJson('/api/inventory-items', [
            'name' => 'Sheep Feed', 'unit' => 'kg',
        ])->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_the_same_item_name_is_allowed_across_different_farms()
    {
        [, $farmA] = $this->farmOwner();
        [$userB] = $this->farmOwner();
        $this->item($farmA, ['name' => 'Sheep Feed']);

        $this->actingAs($userB, 'sanctum')->postJson('/api/inventory-items', [
            'name' => 'Sheep Feed', 'unit' => 'kg',
        ])->assertStatus(201);
    }

    public function test_another_farms_items_are_not_visible()
    {
        [, $farmA] = $this->farmOwner();
        [$userB] = $this->farmOwner();
        $theirs = $this->item($farmA);

        $response = $this->actingAs($userB, 'sanctum')->getJson('/api/inventory-items');

        $this->assertFalse(collect($response->json())->pluck('id')->contains($theirs->id));
    }

    public function test_an_item_can_be_renamed()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm, ['name' => 'Old Name']);

        $this->actingAs($user, 'sanctum')->putJson("/api/inventory-items/{$item->id}", [
            'name' => 'New Name', 'unit' => 'kg', 'low_stock_threshold' => 5,
        ])->assertStatus(200)->assertJson(['name' => 'New Name']);
    }

    public function test_another_farm_cannot_update_this_farms_item()
    {
        [, $farmA] = $this->farmOwner();
        [$userB] = $this->farmOwner();
        $theirs = $this->item($farmA);

        $this->actingAs($userB, 'sanctum')->putJson("/api/inventory-items/{$theirs->id}", [
            'name' => 'Hijacked', 'unit' => 'kg',
        ])->assertStatus(404);
    }

    // ------------------------------------------------------------
    // Transactions: stock derivation
    // ------------------------------------------------------------

    public function test_current_stock_is_derived_from_restock_and_consume_transactions()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/inventory-items/{$item->id}/transactions", [
            'type' => 'restock', 'quantity' => 50, 'transaction_date' => now()->toDateString(),
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->postJson("/api/inventory-items/{$item->id}/transactions", [
            'type' => 'consume', 'quantity' => 20, 'transaction_date' => now()->toDateString(),
        ])->assertStatus(201);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/inventory-items');
        $current = collect($response->json())->firstWhere('id', $item->id);

        $this->assertEquals(30.0, $current['current_stock']);
    }

    public function test_a_consume_transaction_that_would_go_negative_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 10, 'transaction_date' => now()]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/inventory-items/{$item->id}/transactions", [
            'type' => 'consume', 'quantity' => 15, 'transaction_date' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('quantity');
        $this->assertSame(10.0, $item->fresh()->currentStock());
    }

    public function test_a_consume_transaction_exactly_equal_to_current_stock_is_allowed()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 10, 'transaction_date' => now()]);

        $this->actingAs($user, 'sanctum')->postJson("/api/inventory-items/{$item->id}/transactions", [
            'type' => 'consume', 'quantity' => 10, 'transaction_date' => now()->toDateString(),
        ])->assertStatus(201);

        $this->assertSame(0.0, $item->fresh()->currentStock());
    }

    public function test_transaction_history_is_returned_newest_first()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 10, 'transaction_date' => now()->subDays(2)]);
        $item->transactions()->create(['type' => 'consume', 'quantity' => 3, 'transaction_date' => now()]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/inventory-items/{$item->id}/transactions");

        $response->assertStatus(200);
        $this->assertSame('consume', $response->json()[0]['type']);
        $this->assertSame('restock', $response->json()[1]['type']);
    }

    public function test_another_farm_cannot_view_or_record_transactions_for_this_farms_item()
    {
        [, $farmA] = $this->farmOwner();
        [$userB] = $this->farmOwner();
        $theirs = $this->item($farmA);

        $this->actingAs($userB, 'sanctum')->getJson("/api/inventory-items/{$theirs->id}/transactions")->assertStatus(404);
        $this->actingAs($userB, 'sanctum')->postJson("/api/inventory-items/{$theirs->id}/transactions", [
            'type' => 'restock', 'quantity' => 5, 'transaction_date' => now()->toDateString(),
        ])->assertStatus(404);
    }

    // ------------------------------------------------------------
    // Deletion rules
    // ------------------------------------------------------------

    public function test_a_clean_item_with_no_transactions_can_be_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/inventory-items/{$item->id}")->assertStatus(200);
        $this->assertDatabaseMissing('inventory_items', ['id' => $item->id]);
    }

    public function test_the_item_list_flags_has_transactions()
    {
        [$user, $farm] = $this->farmOwner();
        $used = $this->item($farm, ['name' => 'Used']);
        $unused = $this->item($farm, ['name' => 'Unused']);
        $used->transactions()->create(['type' => 'restock', 'quantity' => 5, 'transaction_date' => now()]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/inventory-items');
        $byId = collect($response->json())->keyBy('id');

        $this->assertTrue($byId[$used->id]['has_transactions']);
        $this->assertFalse($byId[$unused->id]['has_transactions']);
    }

    public function test_an_item_with_transactions_cannot_be_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 5, 'transaction_date' => now()]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/inventory-items/{$item->id}")->assertStatus(422);
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id]);
    }

    // ------------------------------------------------------------
    // Low-stock alerts
    // ------------------------------------------------------------

    public function test_a_low_stock_alert_appears_once_stock_falls_to_or_below_the_threshold()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm, ['low_stock_threshold' => 10]);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 50, 'transaction_date' => now()]);

        $noneYet = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $this->assertEmpty(array_filter($noneYet, fn ($a) => $a['type'] === 'low_stock'));

        $item->transactions()->create(['type' => 'consume', 'quantity' => 45, 'transaction_date' => now()]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');
        $lowStock = collect($response->json())->firstWhere('type', 'low_stock');

        $this->assertNotNull($lowStock);
        $this->assertSame($item->id, $lowStock['item_id']);
        $this->assertEquals(5.0, $lowStock['current_stock']);
        $this->assertSame(now()->toDateString(), $lowStock['due_on']);
        $this->assertSame(0, $lowStock['days_until']);
    }

    public function test_an_item_with_no_threshold_never_generates_a_low_stock_alert()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm, ['low_stock_threshold' => null]);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 1, 'transaction_date' => now()]);
        $item->transactions()->create(['type' => 'consume', 'quantity' => 1, 'transaction_date' => now()]);

        $alerts = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();

        $this->assertEmpty(array_filter($alerts, fn ($a) => $a['type'] === 'low_stock'));
    }

    public function test_dismissing_a_low_stock_alert_survives_further_consumption()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm, ['low_stock_threshold' => 10]);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 8, 'transaction_date' => now()]);

        $before = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $key = collect($before)->firstWhere('type', 'low_stock')['key'];

        $this->actingAs($user, 'sanctum')->postJson('/api/alerts/dismiss', ['key' => $key])->assertStatus(200);

        $item->transactions()->create(['type' => 'consume', 'quantity' => 2, 'transaction_date' => now()]);

        $after = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $this->assertEmpty(array_filter($after, fn ($a) => $a['type'] === 'low_stock'));
    }

    public function test_a_new_restock_resets_the_dismissal_with_a_new_key()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm, ['low_stock_threshold' => 10]);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 8, 'transaction_date' => now()]);

        $before = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $originalKey = collect($before)->firstWhere('type', 'low_stock')['key'];

        AlertDismissal::create(['farm_id' => $farm->id, 'alert_key' => $originalKey, 'dismissed_at' => now()]);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 1, 'transaction_date' => now()]);

        $after = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $newAlert = collect($after)->firstWhere('type', 'low_stock');

        $this->assertNotNull($newAlert);
        $this->assertNotSame($originalKey, $newAlert['key']);
    }

    // ------------------------------------------------------------
    // alert_summary regression (Step 3 contract)
    // ------------------------------------------------------------

    public function test_alert_summary_includes_low_stock_as_a_sixth_type()
    {
        [$user, $farm] = $this->farmOwner();
        $item = $this->item($farm, ['low_stock_threshold' => 10]);
        $item->transactions()->create(['type' => 'restock', 'quantity' => 5, 'transaction_date' => now()]);

        $stats = $this->actingAs($user, 'sanctum')->getJson('/api/farm/statistics')->json();

        $this->assertArrayHasKey('low_stock', $stats['alert_summary']['by_type']);
        $this->assertSame(1, $stats['alert_summary']['by_type']['low_stock']);
        $this->assertSame(
            ['breeding_check_due', 'lambing_due', 'weaning_due', 'reinsemination_due', 'health_due', 'low_stock'],
            array_keys($stats['alert_summary']['by_type'])
        );
    }
}
