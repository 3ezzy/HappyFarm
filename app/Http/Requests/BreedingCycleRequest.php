<?php

namespace App\Http\Requests;

use App\Models\Animal;
use App\Models\BreedingCycle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the fields you set when starting or editing a cycle
 * (sire/method/date/notes). Whether the dam is female, and whether she
 * already has an open cycle, are business rules about the specific animal
 * being acted on — checked in BreedingCycleController, not here, matching
 * how sacrifice() checks eligibility in the controller rather than the
 * request class.
 */
class BreedingCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $farmId = $this->user()?->farm?->id;

        // store() is POST /animals/{id}/breeding-cycles — {id} is the dam.
        // update() is PUT /breeding-cycles/{id} — {id} is the cycle, whose
        // dam is looked up via the cycle. Either way, the sire must match
        // the dam's species.
        $dam = $this->isMethod('post')
            ? Animal::find($this->route('id'))
            : BreedingCycle::find($this->route('id'))?->dam;
        $maturityCutoff = Animal::maturityCutoffDate($dam?->type);

        return [
            'sire_id' => [
                'nullable',
                'integer',
                Rule::exists('animals', 'id')->where(function ($q) use ($farmId, $dam, $maturityCutoff) {
                    $q->where('farm_id', $farmId)->where('sex', 'male');

                    if ($dam) {
                        $q->where('type', $dam->type)
                            ->whereNull('deleted_at')
                            ->whereNull('exit_reason')
                            ->where('date_of_birth', '<=', $maturityCutoff);
                    }
                }),
            ],
            'method' => 'required|in:natural,ai',
            'bred_on' => 'required|date|before_or_equal:today',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'sire_id.exists' => 'The selected sire must be a male animal on your farm.',
            'method.required' => 'The breeding method is required.',
            'method.in' => 'The breeding method must be natural or ai.',
            'bred_on.required' => 'The breeding date is required.',
            'bred_on.before_or_equal' => 'The breeding date cannot be in the future.',
        ];
    }
}
