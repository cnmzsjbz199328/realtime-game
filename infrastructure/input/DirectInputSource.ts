import { IInputSource } from '../../core/domain/types';

export class DirectInputSource implements IInputSource {
    id = 'direct-input';
    label = 'Direct Input';

    async getValue(rawInput?: string): Promise<string> {
        if (!rawInput) {
            throw new Error("DirectInputSource requires rawInput to be provided.");
        }
        return rawInput;
    }
}
