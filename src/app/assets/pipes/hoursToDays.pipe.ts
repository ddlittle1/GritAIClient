import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convert Hours to days.
 */
@Pipe({
    name: 'toDays'
})
export class HoursToDays implements PipeTransform {

    transform(value: number) {
        if (value) {
            const days = value / 8;
            if (Math.floor(value % 8) > 0) {
                return days.toFixed(1);
            } else {
                return days;
            }
        } else{
            return 0;
        }
    }
}
