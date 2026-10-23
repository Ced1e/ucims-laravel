<?php

namespace App\Actions;

use Illuminate\Database\Eloquent\Model;

class CloneRecordAction
{
    /**
     * Duplicate an Eloquent model, optionally overriding specific
     * attributes on the new copy (e.g. a "(Copy)" suffix, a new
     * unique identifier for the clone, etc).
     */
    public function execute(Model $model, array $overrides = []): Model
    {
        $clone = $model->replicate();

        foreach ($overrides as $attribute => $value) {
            $clone->{$attribute} = $value;
        }

        $clone->save();

        return $clone;
    }
}