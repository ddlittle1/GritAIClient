import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

/* tslint:disable:max-classes-per-file */
@Pipe({ name: "safeUrl" })
export class SafeUrl implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Pipe({ name: "safeHtml" })
export class SafeHtml implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(style) {
    return this.sanitizer.bypassSecurityTrustHtml(style);
  }
}
