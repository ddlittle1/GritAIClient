import { Pipe, PipeTransform } from "@angular/core";

/**
 * Convert Object to array of keys.
 */
@Pipe({
  name: "objectKeysPipe",
})
export class ObjectKeysPipe implements PipeTransform {
  transform(value: {}): string[] {
    if (!value) {
      return [];
    }

    return Object.keys(value);
  }
}
