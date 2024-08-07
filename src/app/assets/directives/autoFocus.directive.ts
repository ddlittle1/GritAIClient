import { Directive, ElementRef, OnInit } from "@angular/core";

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: `[autofocus]`,
})
export class AutofocusDirective implements OnInit {
  constructor(private el: ElementRef) {
    /*EMPTY*/
  }

  ngOnInit() {
    this.el.nativeElement.focus();
  }
}
