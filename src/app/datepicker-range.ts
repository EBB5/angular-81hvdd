import { Component } from '@angular/core';
import { FormControl, FormControlDirective } from '@angular/forms';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import { default as _rollupMoment, Moment } from 'moment';

const moment = _rollupMoment || _moment;

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

/** @title Datepicker emulating a Year and month picker */
@Component({
  selector: 'datepicker-range',
  templateUrl: 'datepicker-range.html',
  styleUrls: ['datepicker-range.css'],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class DatepickerRange {
  dateFrom = new FormControl(moment());
  dateTo = new FormControl(moment());

  chosenYearHandler(normalizedYear: Moment, fc: FormControl) {
    if (fc == this.dateFrom) {
      console.log('update on from date for year');
    }
    const ctrlValue = fc.value;
    ctrlValue.year(normalizedYear.year());
    fc.setValue(ctrlValue);
  }

  chosenMonthHandler(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Moment>,
    fc: FormControl
  ) {
    const ctrlValue = fc.value;
    ctrlValue.month(normalizedMonth.month());
    fc.setValue(ctrlValue);
    datepicker.close();
    if (fc == this.dateFrom) {
      console.log('update on from date');
      this.syncSrcAndTrgtDate(fc, this.dateTo, true);
    } else {
      console.log('update on to date');
      this.syncSrcAndTrgtDate(this.dateFrom, fc, false);
    }
  }

  ondateFromChange(searchValueEvent: Event | null): void {
    if (searchValueEvent) {
      const searchValue = searchValueEvent.target as HTMLInputElement;
      console.log(`From text change: ${searchValue.value}`);
      this.syncSrcAndTrgtDate(this.dateFrom, this.dateTo, true);
    }
  }

  ondateToChange(searchValueEvent: Event | null): void {
    if (searchValueEvent) {
      const searchValue = searchValueEvent.target as HTMLInputElement;
      console.log(searchValue.value);
      this.syncSrcAndTrgtDate(this.dateFrom, this.dateTo, false);
    }
  }

  syncSrcAndTrgtDate(
    srcControl: FormControl,
    trgtControl: FormControl,
    syncTrgt: boolean
  ): void {
    console.log(`Source control: ${srcControl.value}`);
    console.log(`Target control: ${trgtControl.value}`);

    if (srcControl.value > trgtControl.value) {
      console.log('src > trgt');
      if (syncTrgt) {
        if (this.isValidDate(srcControl)) {
          console.log('sync target');
          const trgtValue = trgtControl.value;
          trgtValue.set(srcControl.value.toObject());
          trgtControl.setValue(trgtValue);
        }
      } else {
        if (this.isValidDate(trgtControl)) {
          const srcValue = srcControl.value;
          srcValue.set(trgtControl.value.toObject());
          srcControl.setValue(srcValue);
        }
      }
    }
  }
  isValidDate(control: FormControl): boolean {
    var validStartDate = moment('01/01/1900', 'DD/MM/YYYY');
    var validEndDate = moment('01/01/2099', 'DD/MM/YYYY');

    return control.value.isBetween(validStartDate, validEndDate);
  }

  getFromDate(truncToFirstDay: boolean): Date {
    return this.getDateFromControl(this.dateFrom, true);
  }

  getToDate(truncToFirstDay: boolean): Date {
    return this.getDateFromControl(this.dateFrom, true);
  }

  getDateFromControl(fc: FormControl, truncToFirstDay: boolean) {
    let resultDate: Date = this.dateFrom.value.toDate();
    resultDate.setMilliseconds(0);
    resultDate.setSeconds(0);
    resultDate.setMinutes(0);
    resultDate.setHours(0);
    if (truncToFirstDay) {
      resultDate.setDate(1);
    }
    const timeZoneDifference = (resultDate.getTimezoneOffset() / 60) * -1;
    resultDate.setTime(
      resultDate.getTime() + timeZoneDifference * 60 * 60 * 1000
    );

    console.log(resultDate);

    return resultDate;
  }
}

/**  Copyright 2019 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */