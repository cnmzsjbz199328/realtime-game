
// Mock Standard Library Wrapper
// In a real scenario, we might import the actual Vector.ts from core, 
// but to ensure isolation, we re-export the key classes here or require the ts-node path.

import { Vector } from '../../../core/runtime/std/Vector';
import { COLORS } from '../../../core/runtime/std/Colors';

// Exporting standard library for injection
export const StandardLibrary = {
    Vector,
    COLORS
};
