import { Pipe, PipeTransform } from '@angular/core';

import * as moment from 'moment';

/**
 * Convert any date to gritDate.
 */
@Pipe({
  name: 'gritDate'
})
export class GritDatePipe implements PipeTransform {

    transform(value: Number) {
        // if string is sent through then send back string until we have a global way of converting string dates using moment
        if (isNaN(Number(value))) {
            return value;
        } else {
            return this.unixToDate(Number(value)); // make it is unix since apparently obj dates from datepicker can become unix by putting it in Number function
        }
    }

    unixToDate(unix) {
        return moment(unix).format('M/D/YYYY');
    }
}
