/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Inject, Injectable, Optional, InjectionToken } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
// TODO(mmalerba): See if we can clean this up at some point.
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import { default as _rollupMoment } from 'moment';
import * as i0 from "@angular/core";
const moment = _rollupMoment || _moment;
/** InjectionToken for moment date adapter to configure options. */
export const MAT_MOMENT_DATE_ADAPTER_OPTIONS = new InjectionToken('MAT_MOMENT_DATE_ADAPTER_OPTIONS', {
    providedIn: 'root',
    factory: MAT_MOMENT_DATE_ADAPTER_OPTIONS_FACTORY,
});
/** @docs-private */
export function MAT_MOMENT_DATE_ADAPTER_OPTIONS_FACTORY() {
    return {
        useUtc: false,
    };
}
/** Creates an array and fills it with values. */
function range(length, valueFunction) {
    const valuesArray = Array(length);
    for (let i = 0; i < length; i++) {
        valuesArray[i] = valueFunction(i);
    }
    return valuesArray;
}
/** Adapts Moment.js Dates for use with Angular Material. */
export class MomentDateAdapter extends DateAdapter {
    constructor(dateLocale, _options) {
        super();
        this._options = _options;
        this.setLocale(dateLocale || moment.locale());
    }
    setLocale(locale) {
        super.setLocale(locale);
        let momentLocaleData = moment.localeData(locale);
        this._localeData = {
            firstDayOfWeek: momentLocaleData.firstDayOfWeek(),
            longMonths: momentLocaleData.months(),
            shortMonths: momentLocaleData.monthsShort(),
            dates: range(31, i => this.createDate(2017, 0, i + 1).format('D')),
            longDaysOfWeek: momentLocaleData.weekdays(),
            shortDaysOfWeek: momentLocaleData.weekdaysShort(),
            narrowDaysOfWeek: momentLocaleData.weekdaysMin(),
        };
    }
    getYear(date) {
        return this.clone(date).year();
    }
    getMonth(date) {
        return this.clone(date).month();
    }
    getDate(date) {
        return this.clone(date).date();
    }
    getDayOfWeek(date) {
        return this.clone(date).day();
    }
    getMonthNames(style) {
        // Moment.js doesn't support narrow month names, so we just use short if narrow is requested.
        return style == 'long' ? this._localeData.longMonths : this._localeData.shortMonths;
    }
    getDateNames() {
        return this._localeData.dates;
    }
    getDayOfWeekNames(style) {
        if (style == 'long') {
            return this._localeData.longDaysOfWeek;
        }
        if (style == 'short') {
            return this._localeData.shortDaysOfWeek;
        }
        return this._localeData.narrowDaysOfWeek;
    }
    getYearName(date) {
        return this.clone(date).format('YYYY');
    }
    getFirstDayOfWeek() {
        return this._localeData.firstDayOfWeek;
    }
    getNumDaysInMonth(date) {
        return this.clone(date).daysInMonth();
    }
    clone(date) {
        return date.clone().locale(this.locale);
    }
    createDate(year, month, date) {
        // Moment.js will create an invalid date if any of the components are out of bounds, but we
        // explicitly check each case so we can throw more descriptive errors.
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (month < 0 || month > 11) {
                throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
            }
            if (date < 1) {
                throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
            }
        }
        const result = this._createMoment({ year, month, date }).locale(this.locale);
        // If the result isn't valid, the date must have been out of bounds for this month.
        if (!result.isValid() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw Error(`Invalid date "${date}" for month with index "${month}".`);
        }
        return result;
    }
    today() {
        return this._createMoment().locale(this.locale);
    }
    parse(value, parseFormat) {
        if (value && typeof value == 'string') {
            return this._createMoment(value, parseFormat, this.locale);
        }
        return value ? this._createMoment(value).locale(this.locale) : null;
    }
    format(date, displayFormat) {
        date = this.clone(date);
        if (!this.isValid(date) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw Error('MomentDateAdapter: Cannot format invalid date.');
        }
        return date.format(displayFormat);
    }
    addCalendarYears(date, years) {
        return this.clone(date).add({ years });
    }
    addCalendarMonths(date, months) {
        return this.clone(date).add({ months });
    }
    addCalendarDays(date, days) {
        return this.clone(date).add({ days });
    }
    toIso8601(date) {
        return this.clone(date).format();
    }
    /**
     * Returns the given value if given a valid Moment or null. Deserializes valid ISO 8601 strings
     * (https://www.ietf.org/rfc/rfc3339.txt) and valid Date objects into valid Moments and empty
     * string into null. Returns an invalid date for all other values.
     */
    deserialize(value) {
        let date;
        if (value instanceof Date) {
            date = this._createMoment(value).locale(this.locale);
        }
        else if (this.isDateInstance(value)) {
            // Note: assumes that cloning also sets the correct locale.
            return this.clone(value);
        }
        if (typeof value === 'string') {
            if (!value) {
                return null;
            }
            date = this._createMoment(value, moment.ISO_8601).locale(this.locale);
        }
        if (date && this.isValid(date)) {
            return this._createMoment(date).locale(this.locale);
        }
        return super.deserialize(value);
    }
    isDateInstance(obj) {
        return moment.isMoment(obj);
    }
    isValid(date) {
        return this.clone(date).isValid();
    }
    invalid() {
        return moment.invalid();
    }
    /** Creates a Moment instance while respecting the current UTC settings. */
    _createMoment(date, format, locale) {
        const { strict, useUtc } = this._options || {};
        return useUtc ? moment.utc(date, format, locale, strict) : moment(date, format, locale, strict);
    }
}
MomentDateAdapter.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: MomentDateAdapter, deps: [{ token: MAT_DATE_LOCALE, optional: true }, { token: MAT_MOMENT_DATE_ADAPTER_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
MomentDateAdapter.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: MomentDateAdapter });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: MomentDateAdapter, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MAT_DATE_LOCALE]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MAT_MOMENT_DATE_ADAPTER_OPTIONS]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9tZW50LWRhdGUtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYXRlcmlhbC1tb21lbnQtYWRhcHRlci9hZGFwdGVyL21vbWVudC1kYXRlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsV0FBVyxFQUFFLGVBQWUsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3BFLGdGQUFnRjtBQUNoRiw2RkFBNkY7QUFDN0YsaUdBQWlHO0FBQ2pHLDJCQUEyQjtBQUMzQiw2REFBNkQ7QUFDN0QsT0FBTyxLQUFLLE9BQU8sTUFBTSxRQUFRLENBQUM7QUFDbEMsZ0RBQWdEO0FBQ2hELE9BQU8sRUFBQyxPQUFPLElBQUksYUFBYSxFQUFpRCxNQUFNLFFBQVEsQ0FBQzs7QUFFaEcsTUFBTSxNQUFNLEdBQUcsYUFBYSxJQUFJLE9BQU8sQ0FBQztBQWtCeEMsbUVBQW1FO0FBQ25FLE1BQU0sQ0FBQyxNQUFNLCtCQUErQixHQUFHLElBQUksY0FBYyxDQUMvRCxpQ0FBaUMsRUFDakM7SUFDRSxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsdUNBQXVDO0NBQ2pELENBQ0YsQ0FBQztBQUVGLG9CQUFvQjtBQUNwQixNQUFNLFVBQVUsdUNBQXVDO0lBQ3JELE9BQU87UUFDTCxNQUFNLEVBQUUsS0FBSztLQUNkLENBQUM7QUFDSixDQUFDO0FBRUQsaURBQWlEO0FBQ2pELFNBQVMsS0FBSyxDQUFJLE1BQWMsRUFBRSxhQUFtQztJQUNuRSxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVB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QyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsT0FBTyxDQUFDLElBQVk7UUFDbEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRCxPQUFPO1FBQ0wsT0FBTyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELDJFQUEyRTtJQUNuRSxhQUFhLENBQ25CLElBQWtCLEVBQ2xCLE1BQWtDLEVBQ2xDLE1BQWU7UUFFZixNQUFNLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBQyxHQUFnQyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztRQUUxRSxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xHLENBQUM7O3FIQXBNVSxpQkFBaUIsa0JBaUJOLGVBQWUsNkJBRTNCLCtCQUErQjt5SEFuQjlCLGlCQUFpQjtrR0FBakIsaUJBQWlCO2tCQUQ3QixVQUFVOzswQkFrQk4sUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxlQUFlOzswQkFDbEMsUUFBUTs7MEJBQ1IsTUFBTTsyQkFBQywrQkFBK0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIE9wdGlvbmFsLCBJbmplY3Rpb25Ub2tlbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RhdGVBZGFwdGVyLCBNQVRfREFURV9MT0NBTEV9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2NvcmUnO1xuLy8gRGVwZW5kaW5nIG9uIHdoZXRoZXIgcm9sbHVwIGlzIHVzZWQsIG1vbWVudCBuZWVkcyB0byBiZSBpbXBvcnRlZCBkaWZmZXJlbnRseS5cbi8vIFNpbmNlIE1vbWVudC5qcyBkb2Vzbid0IGhhdmUgYSBkZWZhdWx0IGV4cG9ydCwgd2Ugbm9ybWFsbHkgbmVlZCB0byBpbXBvcnQgdXNpbmcgdGhlIGAqIGFzYFxuLy8gc3ludGF4LiBIb3dldmVyLCByb2xsdXAgY3JlYXRlcyBhIHN5bnRoZXRpYyBkZWZhdWx0IG1vZHVsZSBhbmQgd2UgdGh1cyBuZWVkIHRvIGltcG9ydCBpdCB1c2luZ1xuLy8gdGhlIGBkZWZhdWx0IGFzYCBzeW50YXguXG4vLyBUT0RPKG1tYWxlcmJhKTogU2VlIGlmIHdlIGNhbiBjbGVhbiB0aGlzIHVwIGF0IHNvbWUgcG9pbnQuXG5pbXBvcnQgKiBhcyBfbW9tZW50IGZyb20gJ21vbWVudCc7XG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tZHVwbGljYXRlLWltcG9ydHNcbmltcG9ydCB7ZGVmYXVsdCBhcyBfcm9sbHVwTW9tZW50LCBNb21lbnQsIE1vbWVudEZvcm1hdFNwZWNpZmljYXRpb24sIE1vbWVudElucHV0fSBmcm9tICdtb21lbnQnO1xuXG5jb25zdCBtb21lbnQgPSBfcm9sbHVwTW9tZW50IHx8IF9tb21lbnQ7XG5cbi8qKiBDb25maWd1cmFibGUgb3B0aW9ucyBmb3Ige0BzZWUgTW9tZW50RGF0ZUFkYXB0ZXJ9LiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXRNb21lbnREYXRlQWRhcHRlck9wdGlvbnMge1xuICAvKipcbiAgICogV2hlbiBlbmFibGVkLCB0aGUgZGF0ZXMgaGF2ZSB0byBtYXRjaCB0aGUgZm9ybWF0IGV4YWN0bHkuXG4gICAqIFNlZSBodHRwczovL21vbWVudGpzLmNvbS9ndWlkZXMvIy9wYXJzaW5nL3N0cmljdC1tb2RlLy5cbiAgICovXG4gIHN0cmljdD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFR1cm5zIHRoZSB1c2Ugb2YgdXRjIGRhdGVzIG9uIG9yIG9mZi5cbiAgICogQ2hhbmdpbmcgdGhpcyB3aWxsIGNoYW5nZSBob3cgQW5ndWxhciBNYXRlcmlhbCBjb21wb25lbnRzIGxpa2UgRGF0ZVBpY2tlciBvdXRwdXQgZGF0ZXMuXG4gICAqIHtAZGVmYXVsdCBmYWxzZX1cbiAgICovXG4gIHVzZVV0Yz86IGJvb2xlYW47XG59XG5cbi8qKiBJbmplY3Rpb25Ub2tlbiBmb3IgbW9tZW50IGRhdGUgYWRhcHRlciB0byBjb25maWd1cmUgb3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBNQVRfTU9NRU5UX0RBVEVfQURBUFRFUl9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPE1hdE1vbWVudERhdGVBZGFwdGVyT3B0aW9ucz4oXG4gICdNQVRfTU9NRU5UX0RBVEVfQURBUFRFUl9PUFRJT05TJyxcbiAge1xuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiBNQVRfTU9NRU5UX0RBVEVfQURBUFRFUl9PUFRJT05TX0ZBQ1RPUlksXG4gIH0sXG4pO1xuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIE1BVF9NT01FTlRfREFURV9BREFQVEVSX09QVElPTlNfRkFDVE9SWSgpOiBNYXRNb21lbnREYXRlQWRhcHRlck9wdGlvbnMge1xuICByZXR1cm4ge1xuICAgIHVzZVV0YzogZmFsc2UsXG4gIH07XG59XG5cbi8qKiBDcmVhdGVzIGFuIGFycmF5IGFuZCBmaWxscyBpdCB3aXRoIHZhbHVlcy4gKi9cbmZ1bmN0aW9uIHJhbmdlPFQ+KGxlbmd0aDogbnVtYmVyLCB2YWx1ZUZ1bmN0aW9uOiAoaW5kZXg6IG51bWJlcikgPT4gVCk6IFRbXSB7XG4gIGNvbnN0IHZhbHVlc0FycmF5ID0gQXJyYXkobGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhbHVlc0FycmF5W2ldID0gdmFsdWVGdW5jdGlvbihpKTtcbiAgfVxuICByZXR1cm4gdmFsdWVzQXJyYXk7XG59XG5cbi8qKiBBZGFwdHMgTW9tZW50LmpzIERhdGVzIGZvciB1c2Ugd2l0aCBBbmd1bGFyIE1hdGVyaWFsLiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vbWVudERhdGVBZGFwdGVyIGV4dGVuZHMgRGF0ZUFkYXB0ZXI8TW9tZW50PiB7XG4gIC8vIE5vdGU6IGFsbCBvZiB0aGUgbWV0aG9kcyB0aGF0IGFjY2VwdCBhIGBNb21lbnRgIGlucHV0IHBhcmFtZXRlciBpbW1lZGlhdGVseSBjYWxsIGB0aGlzLmNsb25lYFxuICAvLyBvbiBpdC4gVGhpcyBpcyB0byBlbnN1cmUgdGhhdCB3ZSdyZSB3b3JraW5nIHdpdGggYSBgTW9tZW50YCB0aGF0IGhhcyB0aGUgY29ycmVjdCBsb2NhbGUgc2V0dGluZ1xuICAvLyB3aGlsZSBhdm9pZGluZyBtdXRhdGluZyB0aGUgb3JpZ2luYWwgb2JqZWN0IHBhc3NlZCB0byB1cy4gSnVzdCBjYWxsaW5nIGAubG9jYWxlKC4uLilgIG9uIHRoZVxuICAvLyBpbnB1dCB3b3VsZCBtdXRhdGUgdGhlIG9iamVjdC5cblxuICBwcml2YXRlIF9sb2NhbGVEYXRhOiB7XG4gICAgZmlyc3REYXlPZldlZWs6IG51bWJlcjtcbiAgICBsb25nTW9udGhzOiBzdHJpbmdbXTtcbiAgICBzaG9ydE1vbnRoczogc3RyaW5nW107XG4gICAgZGF0ZXM6IHN0cmluZ1tdO1xuICAgIGxvbmdEYXlzT2ZXZWVrOiBzdHJpbmdbXTtcbiAgICBzaG9ydERheXNPZldlZWs6IHN0cmluZ1tdO1xuICAgIG5hcnJvd0RheXNPZldlZWs6IHN0cmluZ1tdO1xuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoTUFUX0RBVEVfTE9DQUxFKSBkYXRlTG9jYWxlOiBzdHJpbmcsXG4gICAgQE9wdGlvbmFsKClcbiAgICBASW5qZWN0KE1BVF9NT01FTlRfREFURV9BREFQVEVSX09QVElPTlMpXG4gICAgcHJpdmF0ZSBfb3B0aW9ucz86IE1hdE1vbWVudERhdGVBZGFwdGVyT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnNldExvY2FsZShkYXRlTG9jYWxlIHx8IG1vbWVudC5sb2NhbGUoKSk7XG4gIH1cblxuICBvdmVycmlkZSBzZXRMb2NhbGUobG9jYWxlOiBzdHJpbmcpIHtcbiAgICBzdXBlci5zZXRMb2NhbGUobG9jYWxlKTtcblxuICAgIGxldCBtb21lbnRMb2NhbGVEYXRhID0gbW9tZW50LmxvY2FsZURhdGEobG9jYWxlKTtcbiAgICB0aGlzLl9sb2NhbGVEYXRhID0ge1xuICAgICAgZmlyc3REYXlPZldlZWs6IG1vbWVudExvY2FsZURhdGEuZmlyc3REYXlPZldlZWsoKSxcbiAgICAgIGxvbmdNb250aHM6IG1vbWVudExvY2FsZURhdGEubW9udGhzKCksXG4gICAgICBzaG9ydE1vbnRoczogbW9tZW50TG9jYWxlRGF0YS5tb250aHNTaG9ydCgpLFxuICAgICAgZGF0ZXM6IHJhbmdlKDMxLCBpID0+IHRoaXMuY3JlYXRlRGF0ZSgyMDE3LCAwLCBpICsgMSkuZm9ybWF0KCdEJykpLFxuICAgICAgbG9uZ0RheXNPZldlZWs6IG1vbWVudExvY2FsZURhdGEud2Vla2RheXMoKSxcbiAgICAgIHNob3J0RGF5c09mV2VlazogbW9tZW50TG9jYWxlRGF0YS53ZWVrZGF5c1Nob3J0KCksXG4gICAgICBuYXJyb3dEYXlzT2ZXZWVrOiBtb21lbnRMb2NhbGVEYXRhLndlZWtkYXlzTWluKCksXG4gICAgfTtcbiAgfVxuXG4gIGdldFllYXIoZGF0ZTogTW9tZW50KTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jbG9uZShkYXRlKS55ZWFyKCk7XG4gIH1cblxuICBnZXRNb250aChkYXRlOiBNb21lbnQpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNsb25lKGRhdGUpLm1vbnRoKCk7XG4gIH1cblxuICBnZXREYXRlKGRhdGU6IE1vbWVudCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoZGF0ZSkuZGF0ZSgpO1xuICB9XG5cbiAgZ2V0RGF5T2ZXZWVrKGRhdGU6IE1vbWVudCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoZGF0ZSkuZGF5KCk7XG4gIH1cblxuICBnZXRNb250aE5hbWVzKHN0eWxlOiAnbG9uZycgfCAnc2hvcnQnIHwgJ25hcnJvdycpOiBzdHJpbmdbXSB7XG4gICAgLy8gTW9tZW50LmpzIGRvZXNuJ3Qgc3VwcG9ydCBuYXJyb3cgbW9udGggbmFtZXMsIHNvIHdlIGp1c3QgdXNlIHNob3J0IGlmIG5hcnJvdyBpcyByZXF1ZXN0ZWQuXG4gICAgcmV0dXJuIHN0eWxlID09ICdsb25nJyA/IHRoaXMuX2xvY2FsZURhdGEubG9uZ01vbnRocyA6IHRoaXMuX2xvY2FsZURhdGEuc2hvcnRNb250aHM7XG4gIH1cblxuICBnZXREYXRlTmFtZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLl9sb2NhbGVEYXRhLmRhdGVzO1xuICB9XG5cbiAgZ2V0RGF5T2ZXZWVrTmFtZXMoc3R5bGU6ICdsb25nJyB8ICdzaG9ydCcgfCAnbmFycm93Jyk6IHN0cmluZ1tdIHtcbiAgICBpZiAoc3R5bGUgPT0gJ2xvbmcnKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbG9jYWxlRGF0YS5sb25nRGF5c09mV2VlaztcbiAgICB9XG4gICAgaWYgKHN0eWxlID09ICdzaG9ydCcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9sb2NhbGVEYXRhLnNob3J0RGF5c09mV2VlaztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2xvY2FsZURhdGEubmFycm93RGF5c09mV2VlaztcbiAgfVxuXG4gIGdldFllYXJOYW1lKGRhdGU6IE1vbWVudCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoZGF0ZSkuZm9ybWF0KCdZWVlZJyk7XG4gIH1cblxuICBnZXRGaXJzdERheU9mV2VlaygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9sb2NhbGVEYXRhLmZpcnN0RGF5T2ZXZWVrO1xuICB9XG5cbiAgZ2V0TnVtRGF5c0luTW9udGgoZGF0ZTogTW9tZW50KTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jbG9uZShkYXRlKS5kYXlzSW5Nb250aCgpO1xuICB9XG5cbiAgY2xvbmUoZGF0ZTogTW9tZW50KTogTW9tZW50IHtcbiAgICByZXR1cm4gZGF0ZS5jbG9uZSgpLmxvY2FsZSh0aGlzLmxvY2FsZSk7XG4gIH1cblxuICBjcmVhdGVEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF0ZTogbnVtYmVyKTogTW9tZW50IHtcbiAgICAvLyBNb21lbnQuanMgd2lsbCBjcmVhdGUgYW4gaW52YWxpZCBkYXRlIGlmIGFueSBvZiB0aGUgY29tcG9uZW50cyBhcmUgb3V0IG9mIGJvdW5kcywgYnV0IHdlXG4gICAgLy8gZXhwbGljaXRseSBjaGVjayBlYWNoIGNhc2Ugc28gd2UgY2FuIHRocm93IG1vcmUgZGVzY3JpcHRpdmUgZXJyb3JzLlxuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGlmIChtb250aCA8IDAgfHwgbW9udGggPiAxMSkge1xuICAgICAgICB0aHJvdyBFcnJvcihgSW52YWxpZCBtb250aCBpbmRleCBcIiR7bW9udGh9XCIuIE1vbnRoIGluZGV4IGhhcyB0byBiZSBiZXR3ZWVuIDAgYW5kIDExLmApO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0ZSA8IDEpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoYEludmFsaWQgZGF0ZSBcIiR7ZGF0ZX1cIi4gRGF0ZSBoYXMgdG8gYmUgZ3JlYXRlciB0aGFuIDAuYCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fY3JlYXRlTW9tZW50KHt5ZWFyLCBtb250aCwgZGF0ZX0pLmxvY2FsZSh0aGlzLmxvY2FsZSk7XG5cbiAgICAvLyBJZiB0aGUgcmVzdWx0IGlzbid0IHZhbGlkLCB0aGUgZGF0ZSBtdXN0IGhhdmUgYmVlbiBvdXQgb2YgYm91bmRzIGZvciB0aGlzIG1vbnRoLlxuICAgIGlmICghcmVzdWx0LmlzVmFsaWQoKSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoYEludmFsaWQgZGF0ZSBcIiR7ZGF0ZX1cIiBmb3IgbW9udGggd2l0aCBpbmRleCBcIiR7bW9udGh9XCIuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHRvZGF5KCk6IE1vbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2NyZWF0ZU1vbWVudCgpLmxvY2FsZSh0aGlzLmxvY2FsZSk7XG4gIH1cblxuICBwYXJzZSh2YWx1ZTogYW55LCBwYXJzZUZvcm1hdDogc3RyaW5nIHwgc3RyaW5nW10pOiBNb21lbnQgfCBudWxsIHtcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlTW9tZW50KHZhbHVlLCBwYXJzZUZvcm1hdCwgdGhpcy5sb2NhbGUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUgPyB0aGlzLl9jcmVhdGVNb21lbnQodmFsdWUpLmxvY2FsZSh0aGlzLmxvY2FsZSkgOiBudWxsO1xuICB9XG5cbiAgZm9ybWF0KGRhdGU6IE1vbWVudCwgZGlzcGxheUZvcm1hdDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBkYXRlID0gdGhpcy5jbG9uZShkYXRlKTtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZChkYXRlKSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ01vbWVudERhdGVBZGFwdGVyOiBDYW5ub3QgZm9ybWF0IGludmFsaWQgZGF0ZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGUuZm9ybWF0KGRpc3BsYXlGb3JtYXQpO1xuICB9XG5cbiAgYWRkQ2FsZW5kYXJZZWFycyhkYXRlOiBNb21lbnQsIHllYXJzOiBudW1iZXIpOiBNb21lbnQge1xuICAgIHJldHVybiB0aGlzLmNsb25lKGRhdGUpLmFkZCh7eWVhcnN9KTtcbiAgfVxuXG4gIGFkZENhbGVuZGFyTW9udGhzKGRhdGU6IE1vbWVudCwgbW9udGhzOiBudW1iZXIpOiBNb21lbnQge1xuICAgIHJldHVybiB0aGlzLmNsb25lKGRhdGUpLmFkZCh7bW9udGhzfSk7XG4gIH1cblxuICBhZGRDYWxlbmRhckRheXMoZGF0ZTogTW9tZW50LCBkYXlzOiBudW1iZXIpOiBNb21lbnQge1xuICAgIHJldHVybiB0aGlzLmNsb25lKGRhdGUpLmFkZCh7ZGF5c30pO1xuICB9XG5cbiAgdG9Jc284NjAxKGRhdGU6IE1vbWVudCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoZGF0ZSkuZm9ybWF0KCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZ2l2ZW4gdmFsdWUgaWYgZ2l2ZW4gYSB2YWxpZCBNb21lbnQgb3IgbnVsbC4gRGVzZXJpYWxpemVzIHZhbGlkIElTTyA4NjAxIHN0cmluZ3NcbiAgICogKGh0dHBzOi8vd3d3LmlldGYub3JnL3JmYy9yZmMzMzM5LnR4dCkgYW5kIHZhbGlkIERhdGUgb2JqZWN0cyBpbnRvIHZhbGlkIE1vbWVudHMgYW5kIGVtcHR5XG4gICAqIHN0cmluZyBpbnRvIG51bGwuIFJldHVybnMgYW4gaW52YWxpZCBkYXRlIGZvciBhbGwgb3RoZXIgdmFsdWVzLlxuICAgKi9cbiAgb3ZlcnJpZGUgZGVzZXJpYWxpemUodmFsdWU6IGFueSk6IE1vbWVudCB8IG51bGwge1xuICAgIGxldCBkYXRlO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIGRhdGUgPSB0aGlzLl9jcmVhdGVNb21lbnQodmFsdWUpLmxvY2FsZSh0aGlzLmxvY2FsZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmlzRGF0ZUluc3RhbmNlKHZhbHVlKSkge1xuICAgICAgLy8gTm90ZTogYXNzdW1lcyB0aGF0IGNsb25pbmcgYWxzbyBzZXRzIHRoZSBjb3JyZWN0IGxvY2FsZS5cbiAgICAgIHJldHVybiB0aGlzLmNsb25lKHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBkYXRlID0gdGhpcy5fY3JlYXRlTW9tZW50KHZhbHVlLCBtb21lbnQuSVNPXzg2MDEpLmxvY2FsZSh0aGlzLmxvY2FsZSk7XG4gICAgfVxuICAgIGlmIChkYXRlICYmIHRoaXMuaXNWYWxpZChkYXRlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZU1vbWVudChkYXRlKS5sb2NhbGUodGhpcy5sb2NhbGUpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwZXIuZGVzZXJpYWxpemUodmFsdWUpO1xuICB9XG5cbiAgaXNEYXRlSW5zdGFuY2Uob2JqOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gbW9tZW50LmlzTW9tZW50KG9iaik7XG4gIH1cblxuICBpc1ZhbGlkKGRhdGU6IE1vbWVudCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNsb25lKGRhdGUpLmlzVmFsaWQoKTtcbiAgfVxuXG4gIGludmFsaWQoKTogTW9tZW50IHtcbiAgICByZXR1cm4gbW9tZW50LmludmFsaWQoKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgTW9tZW50IGluc3RhbmNlIHdoaWxlIHJlc3BlY3RpbmcgdGhlIGN1cnJlbnQgVVRDIHNldHRpbmdzLiAqL1xuICBwcml2YXRlIF9jcmVhdGVNb21lbnQoXG4gICAgZGF0ZT86IE1vbWVudElucHV0LFxuICAgIGZvcm1hdD86IE1vbWVudEZvcm1hdFNwZWNpZmljYXRpb24sXG4gICAgbG9jYWxlPzogc3RyaW5nLFxuICApOiBNb21lbnQge1xuICAgIGNvbnN0IHtzdHJpY3QsIHVzZVV0Y306IE1hdE1vbWVudERhdGVBZGFwdGVyT3B0aW9ucyA9IHRoaXMuX29wdGlvbnMgfHwge307XG5cbiAgICByZXR1cm4gdXNlVXRjID8gbW9tZW50LnV0YyhkYXRlLCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KSA6IG1vbWVudChkYXRlLCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KTtcbiAgfVxufVxuIl19