<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HealthRecordRequest;
use App\Models\Animal;
use App\Models\HealthRecord;
use Illuminate\Http\Request;

class HealthRecordController extends Controller
{
    public function index(Request $request, $animalId)
    {
        $animal = $this->findOwnedAnimal($request, $animalId);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $records = $animal->healthRecords()->orderByDesc('administered_on')->get();

        return response()->json($records->map(fn ($r) => $this->present($r)));
    }

    public function store(HealthRecordRequest $request, $animalId)
    {
        $animal = $this->findOwnedAnimal($request, $animalId);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $record = $animal->healthRecords()->create($request->validated());

        return response()->json($this->present($record), 201);
    }

    public function update(HealthRecordRequest $request, $id)
    {
        $record = $this->findOwnedRecord($request, $id);

        if (!$record) {
            return response()->json(['error' => 'Health record not found'], 404);
        }

        $record->update($request->validated());

        return response()->json($this->present($record));
    }

    public function destroy(Request $request, $id)
    {
        $record = $this->findOwnedRecord($request, $id);

        if (!$record) {
            return response()->json(['error' => 'Health record not found'], 404);
        }

        $record->delete();

        return response()->json(['message' => 'Health record deleted']);
    }

    private function findOwnedAnimal(Request $request, $animalId): ?Animal
    {
        $user = $request->user();

        return Animal::whereHas('farm', fn ($q) => $q->where('user_id', $user->id))->find($animalId);
    }

    private function findOwnedRecord(Request $request, $id): ?HealthRecord
    {
        $user = $request->user();

        return HealthRecord::whereHas('animal.farm', fn ($q) => $q->where('user_id', $user->id))->find($id);
    }

    private function present(HealthRecord $record): array
    {
        return [
            'id' => $record->id,
            'animal_id' => $record->animal_id,
            'kind' => $record->kind,
            'product' => $record->product,
            'dose' => $record->dose,
            'administered_on' => $record->administered_on->toDateString(),
            'next_due_on' => $record->next_due_on?->toDateString(),
            'withdrawal_until' => $record->withdrawal_until?->toDateString(),
            'cost' => $record->cost !== null ? (float) $record->cost : null,
            'veterinarian' => $record->veterinarian,
            'notes' => $record->notes,
        ];
    }
}
