import { PipeTransform, Pipe} from '@angular/core';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe {
  transform(value: Array<any>, field: string, desc: boolean): any {

      if (field === null || field === '') return value;

      if (!desc) desc = false;
      let descNumber = desc ? 1 : -1;

      return value.sort((l, r): number => {
              if (this.isDate(l[field]) < this.isDate(r[field])) return (1 * descNumber);
              if (this.isDate(l[field]) > this.isDate(r[field])) return (-1 * descNumber);
              return 0
          });
  }

    isDate(field: any): any {
        if (isNaN(Date.parse(field))) {
            return field;
        }
        return Date.parse(field);
    }
}