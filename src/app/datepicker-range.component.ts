import {Component, Input, OnInit} from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDatepicker, MatDatepickerInputEvent} from '@angular/material/datepicker';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module, and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import {  Moment } from 'moment';
import { DatepickerRangeConfig } from './datepicker-range-config';
import {DatepickerRangePurpose} from './datepicker-range-purpose';
import {MatSelectChange} from '@angular/material/select';

const moment = _moment;

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
  templateUrl: 'datepicker-range.component.html',
  styleUrls: ['datepicker-range.component.css'],
 })

export class DatepickerRangeComponent implements OnInit {
  /** @srcComponentName: Source component where the datepicker component is used on */
  @Input() srcComponentName: string;
  /** @filterOn: specific use of the date range component on the source component (filter for CreationDate, ModifiedDate, ...) */
  @Input() filterOn: DatepickerRangePurpose[] = [
    {value: 'default', viewValue: 'Default', calendarStartView: 'multi-year'},
    {value: 'modified', viewValue: 'Date Modified', calendarStartView: 'month'}
  ];


  dateFrom = new FormControl(moment());
  dateTo = new FormControl(moment());
  selectedFilter: string | undefined;
  selectedFilterObj: DatepickerRangePurpose | undefined;
  private truncToFirstDay: boolean;

  /**
   * Converts the moment value of a control to a normal Date object
   * @param fc Formcontrol
   * @param truncToFirstDay Indicates that the day part needs to be put on the first day of the month
   */
  private static getDateFromControl(fc: FormControl, truncToFirstDay: boolean): Moment {
    let resultDate: Moment = fc.value.set({'hour': 0, 'minute': 0, 'second': 0, 'milisecond': 0});
    if (truncToFirstDay) {
      resultDate = resultDate.date(1);
    }
    // const timeZoneDifference = (resultDate.getTimezoneOffset() / 60) * -1;
    // resultDate.setTime(
    //   resultDate.getTime() + timeZoneDifference * 60 * 60 * 1000
    // );

    console.log(resultDate);

    return resultDate;
  }

  toTimezoneZeroOffset(momentValue: Moment): Date {
    const resultDate = momentValue.toDate();
    const timeZoneDifference = (resultDate.getTimezoneOffset() / 60) * -1;
    resultDate.setTime(
      resultDate.getTime() + timeZoneDifference * 60 * 60 * 1000
    );
    return resultDate;
  }

  /**
   * Handler that is called when the year has been selected when there is shown a year/multiyear view.
   * @param normalizedYear year from the moment
   * @param fc Form control to set the value on
   */
  chosenYearHandler(normalizedYear: Moment, fc: FormControl): void {
    if (fc === this.dateFrom) {
      console.log('update on from date for year');
    }
    const ctrlValue = fc.value;
    ctrlValue.year(normalizedYear.year());
    fc.setValue(ctrlValue);
  }

  /**
   * Handler that is called when the month has been selected when there is shown a month view
   * @param normalizedMonth month from the moment
   * @param datepicker datepicker component reference
   * @param fc Form control to set value on
   */
  chosenMonthHandler(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Moment>,
    fc: FormControl
  ): void {
    const ctrlValue = fc.value;
    ctrlValue.month(normalizedMonth.month());
    fc.setValue(ctrlValue);
    datepicker.close();
    if (fc === this.dateFrom) {
      console.log('update on from date');
      this.syncSrcAndTrgtDate(fc, this.dateTo, true);
    } else {
      console.log('update on to date');
      this.syncSrcAndTrgtDate(this.dateFrom, fc, false);
    }
  }

  /**
   * Handler that is being called when the input of the datepicker is updated manually
   * @param searchValueEvent event that contains the value of the date
   */
  onDateFromChange(searchValueEvent: MatDatepickerInputEvent<Date>): void {
    if (searchValueEvent) {
      console.log(`From text change: ${searchValueEvent.value}`);
      this.syncSrcAndTrgtDate(this.dateFrom, this.dateTo, true);
    }
  }
  /**
   * Handler that is being called when the input of the datepicker is updated manually
   * @param searchValueEvent event that contains the value of the date
   */
  onDateToChange(searchValueEvent: MatDatepickerInputEvent<Date>): void {
    if (searchValueEvent) {
      console.log(`To text change: ${searchValueEvent.value}`);
      this.syncSrcAndTrgtDate(this.dateFrom, this.dateTo, false);
    }
  }

  /**
   * Handler that is being called when there is selected a new 'filter on' item from the dropdown menu.
   * It loads the dates that are linked to the specific item
   * @param selectionEvent event that contains the value of the filter
   */
  onFilterOnChange(selectionEvent: MatSelectChange): void {
    if (selectionEvent) {
      this.selectedFilterObj = this.filterOn.find(filter => filter.value === this.selectedFilter);
      this.truncToFirstDay = this.selectedFilterObj?.calendarStartView === 'multi-year'
        ||  this.selectedFilterObj?.calendarStartView === 'year';
      this.loadDatesFromStorage();
      this.assignDatesToFormControls();
    }
  }

  /**
   * Checks and corrects the values of the form controls that the value of the from date is not bigger than the to date
   * @param srcControl from date control
   * @param trgtControl to date control
   * @param syncTrgt indicates that the target control needs to be updated with the source control value
   */
  syncSrcAndTrgtDate(
    srcControl: FormControl,
    trgtControl: FormControl,
    syncTrgt: boolean
  ): void {
    const normalizedSrcDate = DatepickerRangeComponent.getDateFromControl(srcControl, this.truncToFirstDay);
    const normalizedTrgtDate = DatepickerRangeComponent.getDateFromControl(trgtControl, this.truncToFirstDay);
    console.log(`Source control: ${normalizedSrcDate}`);
    console.log(`Target control: ${normalizedTrgtDate}`);

    // put the controls always on the normalized date, to have the visual correct value.
    const srcValue = srcControl.value;
    srcValue.set(normalizedSrcDate.toObject());
    const trgtValue = trgtControl.value;
    trgtValue.set(normalizedTrgtDate.toObject());

    if (normalizedSrcDate > normalizedTrgtDate) {
      console.log('src > trgt');
      if (syncTrgt) {
        if (this.isValidDate(srcControl)) {
          console.log('sync target');
          trgtValue.set(normalizedSrcDate.toObject());
          trgtControl.setValue(trgtValue);
        }
      } else {
        if (this.isValidDate(trgtControl)) {
          srcValue.set(normalizedTrgtDate.toObject());
          srcControl.setValue(srcValue);
        }
      }
    }
    if (this.isValidDate(srcControl) && this.isValidDate(trgtControl)) {
      this.storeDatesToStorage();
    }
  }

  /**
   * Checks that the date that is entered is a valid date between certain boundaries
   * @param control Form control with moment value, that needs to be validated
   */
  isValidDate(control: FormControl): boolean {
    const validStartDate = moment('01/01/1900', 'DD/MM/YYYY');
    const validEndDate = moment('01/01/2099', 'DD/MM/YYYY');

    return control.value.isBetween(validStartDate, validEndDate);
  }


  /**
   * Retrieve existing config from the session storage and add/update the config for the component name.
   */
  storeDatesToStorage(): void {
    const configItems = this.loadDatesFromStorage();
    if (!this.selectedFilterObj) {
      return;
    }

    configItems.set(this.selectedFilterObj.value,
      {
        dateFrom: this.toTimezoneZeroOffset(DatepickerRangeComponent.getDateFromControl(this.dateFrom, this.truncToFirstDay)),
        dateTo: this.toTimezoneZeroOffset(DatepickerRangeComponent.getDateFromControl(this.dateTo, this.truncToFirstDay))
      }
    );
    const configItemsStorageJson = JSON.stringify(Object.fromEntries(configItems));
    sessionStorage.setItem(`date-range-config-${this.srcComponentName}`, configItemsStorageJson);
  }

  loadDatesFromStorage():
    Map<string, DatepickerRangeConfig> {
    let configItems = new Map<string, DatepickerRangeConfig>();
    const configItemsStorageJson = sessionStorage.getItem(`date-range-config-${this.srcComponentName}`);
    // reload the previous stored config so that we have all the purposes of the component
    if (configItemsStorageJson) {
      const configItemsObj = JSON.parse(configItemsStorageJson);
      configItems = new Map<string, DatepickerRangeConfig>(Object.entries(configItemsObj));
    }
    return configItems;
  }

  assignDatesToFormControls() {
    const confItems = this.loadDatesFromStorage();
    if (!this.selectedFilterObj) {
      return;
    }
    if (confItems.has(this.selectedFilterObj.value)) {
      const filterItem = confItems.get(this.selectedFilterObj.value);
      this.dateFrom.setValue(moment(filterItem?.dateFrom));
      this.dateTo.setValue(moment(filterItem?.dateTo));
  } else {
      this.dateFrom.setValue(moment(new Date()));
      this.dateTo.setValue(moment(new Date()));
    }
  }
  ngOnInit(): void {
     if (this.filterOn.length > 0) {
       this.selectedFilter = this.filterOn[0].value;
       this.selectedFilterObj = this.filterOn[0];
       this.truncToFirstDay = this.selectedFilterObj?.calendarStartView === 'multi-year'
         ||  this.selectedFilterObj?.calendarStartView === 'year';
     }
    this.loadDatesFromStorage();
    this.assignDatesToFormControls();

  }
}
