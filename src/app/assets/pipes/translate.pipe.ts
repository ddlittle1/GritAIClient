import { Pipe, PipeTransform } from '@angular/core';

import { TranslationService } from '../../app/services/translation/translation.service';

@Pipe({
  name: 'translate'
})
export class TranslationPipe implements PipeTransform {

    constructor() { /*empty*/ }

    transform(value: string, variables?: object): string {
        return TranslationService.translate(value, variables);
    }
}
