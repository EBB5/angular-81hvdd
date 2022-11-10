import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDatepicker, MatDatepickerInputEvent} from '@angular/material/datepicker';

import { DatepickerRangeConfig } from './datepicker-range-config';
import {DatepickerRangePurpose} from './datepicker-range-purpose';
import {MatSelectChange} from '@angular/material/select';
import {Moment} from 'moment';

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
  @Output() newDateRangeEvent = new EventEmitter<DatepickerRangeConfig>();


  dateFrom = new FormControl(new Date());
  dateTo = new FormControl(new Date());
  selectedFilter: string | undefined;
  selectedFilterObj: DatepickerRangePurpose | undefined;
  private truncToFirstDay: boolean;

  /**
   * Converts the Date value of a control to a normalized Date
   * @param controlDate Formcontrol date
   * @param truncToFirstDay Indicates that the day part needs to be put on the first day of the month
   */
  private static normalizeDateFromControl(controlDate: Date, truncToFirstDay: boolean): Date {
    const resultDate: Date = new Date(controlDate);
    resultDate.setHours(0);
    resultDate.setMinutes(0);
    resultDate.setSeconds(0);
    resultDate.setMilliseconds(0);

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
  /**
   * Handler that is called when the year has been selected when there is shown a year/multiyear view.
   * @param normalizedYear year from the date
   * @param fc Form control to set the value on
   */
  chosenYearHandler(normalizedYear: Moment, fc: FormControl): void {
    if (fc === this.dateFrom) {
      console.log('update on from date for year');
    }
    const ctrlValue = new Date(fc.value);
    ctrlValue.setFullYear(normalizedYear.toDate().getFullYear());
    fc.setValue(ctrlValue);
  }

  /**
   * Handler that is called when the month has been selected when there is shown a month view
   * @param normalizedMonth month from the date
   * @param datepicker datepicker component reference
   * @param fc Form control to set value on
   */
  chosenMonthHandler(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Date>,
    fc: FormControl
  ): void {
    const ctrlValue = new Date(fc.value);
    ctrlValue.setMonth(normalizedMonth.toDate().getMonth());
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
    const normalizedSrcDate = DatepickerRangeComponent.normalizeDateFromControl(srcControl.value, this.truncToFirstDay);
    const normalizedTrgtDate = DatepickerRangeComponent.normalizeDateFromControl(trgtControl.value, this.truncToFirstDay);
    console.log(`Source control: ${normalizedSrcDate}`);
    console.log(`Target control: ${normalizedTrgtDate}`);

    // put the controls always on the normalized date, to have the visual correct value.
    srcControl.setValue(normalizedSrcDate);
    trgtControl.setValue(normalizedTrgtDate);

    if (normalizedSrcDate > normalizedTrgtDate) {
      console.log('src > trgt');
      if (syncTrgt) {
        if (this.isValidDate(srcControl)) {
          console.log('sync target');
          trgtControl.setValue(new Date(normalizedSrcDate));
        }
      } else {
        if (this.isValidDate(trgtControl)) {
          srcControl.setValue(new Date(normalizedTrgtDate));
        }
      }
    }
    if (this.isValidDate(srcControl) && this.isValidDate(trgtControl)) {
      const configItems = this.loadDatesFromStorage();
      this.storeDatesToStorage(configItems);
    }
  }

  /**
   * Checks that the date that is entered is a valid date between certain boundaries
   * @param control Form control with date value, that needs to be validated
   */
  isValidDate(control: FormControl): boolean {
    const validStartDate = new Date(1900, 1, 1);
    const validEndDate = new Date(2099, 1, 1);

    return control.value >= validStartDate && control.value <= validEndDate;
  }


  /**
   * Retrieve existing config from the session storage and add/update the config for the component name.
   */
  storeDatesToStorage(configItems: Map<string, DatepickerRangeConfig>): void {
    if (!this.selectedFilterObj) {
      return;
    }

    configItems.set(this.selectedFilterObj.value,
      this.getValuesOfFilter()
    );
    const configItemsStorageJson = JSON.stringify(Object.fromEntries(configItems));
    sessionStorage.setItem(`date-range-config-${this.srcComponentName}`, configItemsStorageJson);
  }

  private getValuesOfFilter() {
    return {
      dateFrom: DatepickerRangeComponent.normalizeDateFromControl(this.dateFrom.value, this.truncToFirstDay),
      dateTo: DatepickerRangeComponent.normalizeDateFromControl(this.dateTo.value, this.truncToFirstDay),
      filterValue: this.selectedFilter
    };
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
      this.dateFrom.setValue(filterItem?.dateFrom);
      this.dateTo.setValue(filterItem?.dateTo);
  } else {
      const normalizedDate = DatepickerRangeComponent.normalizeDateFromControl(new Date(), this.truncToFirstDay);
      this.dateFrom.setValue(normalizedDate);
      this.dateTo.setValue(normalizedDate);
    }
  }

  emitDateFiltering() {
    const configItems = this.loadDatesFromStorage();
    let item: DatepickerRangeConfig | undefined;
    if (this.selectedFilterObj) {
      if (configItems.has(this.selectedFilterObj.value)) {
       item = configItems.get(this.selectedFilterObj.value);
      } else {
        // in case the user did not touch the dates ans therefor there is nothing in the sessionstorage
        item = this.getValuesOfFilter();
      }
    }
    if (item) {
      this.newDateRangeEvent.emit(item);
    }
  }
}
