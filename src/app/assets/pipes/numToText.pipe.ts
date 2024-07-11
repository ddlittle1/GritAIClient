import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convert Object to array of keys.
 */
@Pipe({
  name: 'zeroToHyphen'
})
export class NumberToTextPipe implements PipeTransform {

  transform(value: number) {
    if (value === 0 || isNaN(Number(value))) {
      return '-';
    }
    return value;
  }
}
