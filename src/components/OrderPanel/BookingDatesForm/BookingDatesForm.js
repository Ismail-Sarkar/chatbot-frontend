import React, { useState, useEffect } from 'react';
import { array, bool, func, number, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, intlShape, injectIntl } from '../../../util/reactIntl';
import { required, bookingDatesRequired, composeValidators } from '../../../util/validators';
import {
  START_DATE,
  END_DATE,
  getStartOf,
  addTime,
  isSameDay,
  isDateSameOrAfter,
  isInRange,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  monthIdString,
  initialVisibleMonth,
  stringifyDateToISO8601,
} from '../../../util/dates';
import { LINE_ITEM_DAY, LINE_ITEM_NIGHT, TIME_SLOT_TIME, propTypes } from '../../../util/types';
import { ADVENTURELY_PROCESS_NAME, BOOKING_PROCESS_NAME } from '../../../transactions/transaction';

import {
  Form,
  IconArrowHead,
  PrimaryButton,
  FieldDateRangeInput,
  H6,
  FieldTextInput,
  FieldDateInput,
} from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import css from './BookingDatesForm.module.css';
import { SingleDatePicker } from 'react-dates';
import MuiMultiSelect from '../../MuiMultiSelect/MuiMultiSelect';
import moment from 'moment';
import { isArray } from 'lodash';

const TODAY = new Date();

const nextMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, offset, 'months');
const prevMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, -1 * offset, 'months');
const endOfRange = (date, dayCountAvailableForBooking, timeZone) =>
  getStartOf(date, 'day', timeZone, dayCountAvailableForBooking - 1, 'days');

/**
 * Return a boolean indicating if given date can be found in an array
 * of tile slots (start dates).
 */
const timeSlotsContain = (timeSlots, date, timeZone) => {
  const foundIndex = timeSlots.findIndex(slot =>
    isInRange(date, slot.attributes.start, slot.attributes.end, 'hour', timeZone)
  );
  return foundIndex > -1;
};

const pickMonthlyTimeSlots = (monthlyTimeSlots, date, timeZone) => {
  const monthId = monthIdString(date, timeZone);
  return monthlyTimeSlots?.[monthId]?.timeSlots || [];
};

/**
 * Find first blocked date between two dates.
 * If none is found, null is returned.
 *
 * @param {Object} monthlyTimeSlots propTypes.timeSlot objects
 * @param {Moment} startDate start date, exclusive
 * @param {Moment} endDate end date, exclusive
 * @param {String} timeZone time zone id
 */
const firstBlockedBetween = (monthlyTimeSlots, startDate, endDate, timeZone) => {
  const firstDate = getStartOf(startDate, 'day', timeZone, 1, 'days');
  if (isSameDay(firstDate, endDate, timeZone)) {
    return null;
  }

  const timeSlots = pickMonthlyTimeSlots(monthlyTimeSlots, firstDate, timeZone);
  const contains = timeSlotsContain(timeSlots, firstDate, timeZone);
  return contains ? firstBlockedBetween(monthlyTimeSlots, firstDate, endDate, timeZone) : firstDate;
};

/**
 * Find last blocked date between two dates.
 * If none is found, null is returned.
 *
 * @param {Array} timeSlots propTypes.timeSlot objects
 * @param {Moment} startDate start date, exclusive
 * @param {Moment} endDate end date, exclusive
 * @param {String} timeZone time zone id
 */
const lastBlockedBetween = (monthlyTimeSlots, startDate, endDate, timeZone) => {
  const previousDate = getStartOf(endDate, 'day', timeZone, -1, 'days');
  if (isSameDay(previousDate, startDate, timeZone)) {
    return null;
  }

  const timeSlots = pickMonthlyTimeSlots(monthlyTimeSlots, previousDate, timeZone);
  return timeSlotsContain(timeSlots, previousDate, timeZone)
    ? lastBlockedBetween(monthlyTimeSlots, startDate, previousDate, timeZone)
    : previousDate;
};

/**
 * Check if a blocked date can be found between two dates.
 *
 * @param {Object} timeSlots propTypes.timeSlot objects
 * @param {String} timeZone time zone id
 * @param {Moment} startDate start date, exclusive
 * @param {Moment} endDate end date, exclusive
 */
const isBlockedBetween = (monthlyTimeSlots, timeZone) => (startDate, endDate) => {
  const startInListingTZ = getStartOf(
    timeOfDayFromLocalToTimeZone(startDate, timeZone),
    'day',
    timeZone
  );
  const endInListingTZ = getStartOf(
    timeOfDayFromLocalToTimeZone(endDate, timeZone),
    'day',
    timeZone
  );
  return !!firstBlockedBetween(monthlyTimeSlots, startInListingTZ, endInListingTZ, timeZone);
};

const isStartDateSelected = (timeSlots, startDate, endDate, focusedInput) => {
  return (
    timeSlots && startDate && (!endDate || focusedInput === END_DATE) && focusedInput !== START_DATE
  );
};

const endDateToPickerDate = (unitType, endDate, timeZone) => {
  const isValid = endDate instanceof Date;
  const isDaily = unitType === LINE_ITEM_DAY;

  if (!isValid) {
    return null;
  } else if (isDaily) {
    // API end dates are exlusive, so we need to shift them with daily
    // booking.
    return getStartOf(endDate, 'day', timeZone, -1, 'days');
  } else {
    return endDate;
  }
};

/**
 * Returns an isOutsideRange function that can be passed to
 * a react-dates DateRangePicker component.
 */

const isOutsideRangeFn = (
  monthlyTimeSlots,
  startDate,
  endDate,
  lineItemUnitType,
  dayCountAvailableForBooking,
  timeZone
) => focusedInput => {
  const endOfAvailableRange = dayCountAvailableForBooking - 1;
  const endOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange, 'days');
  const outOfBookableDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange + 1, 'days');
  const startOfStartDay = getStartOf(startDate, 'day', timeZone);

  // start date selected, end date missing
  const startDateSelected = isStartDateSelected(monthlyTimeSlots, startDate, endDate, focusedInput);
  const endOfBookableRange = startDateSelected
    ? firstBlockedBetween(monthlyTimeSlots, startDate, outOfBookableDate, timeZone)
    : null;

  if (endOfBookableRange) {
    // end the range so that the booking can end at latest on
    // nightly booking: the day the next booking starts
    // daily booking: the day before the next booking starts
    return day => {
      const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
      const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
      const lastDayToEndBooking = endDateToPickerDate(
        lineItemUnitType,
        endOfBookableRange,
        timeZone
      );
      return (
        !isDateSameOrAfter(dayInListingTZ, startOfStartDay) ||
        !isDateSameOrAfter(lastDayToEndBooking, dayInListingTZ)
      );
    };
  }

  // end date selected, start date missing
  // -> limit the earliest start date for the booking so that it
  // needs to be after the previous booked date
  const endDateSelected = monthlyTimeSlots && endDate && !startDate && focusedInput !== END_DATE;
  const previousBookedDate = endDateSelected
    ? lastBlockedBetween(monthlyTimeSlots, TODAY, endDate, timeZone)
    : null;

  if (previousBookedDate) {
    return day => {
      const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
      const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
      const firstDayToStartBooking = getStartOf(previousBookedDate, 'day', timeZone, 1, 'days');
      return (
        !isDateSameOrAfter(dayInListingTZ, firstDayToStartBooking) ||
        !isDateSameOrAfter(endOfAvailableRangeDate, dayInListingTZ)
      );
    };
  }

  // standard isOutsideRange function
  return day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
    return (
      !isDateSameOrAfter(dayInListingTZ, TODAY) ||
      !isDateSameOrAfter(endOfAvailableRangeDate, dayInListingTZ)
    );
  };
};

// Checks if time slot (propTypes.timeSlot) start time equals a day (moment)
const timeSlotEqualsDay = (timeSlot, day, timeZone) => {
  const isTimeBased = timeSlot?.attributes?.type === TIME_SLOT_TIME;
  return isTimeBased
    ? isInRange(day, timeSlot.attributes.start, timeSlot.attributes.end, undefined, timeZone)
    : false;
};

/**
 * Returns an isDayBlocked function that can be passed to
 * a react-dates DateRangePicker component.
 */
const isDayBlockedFn = (
  monthlyTimeSlots,
  startDate,
  endDate,
  unitType,
  dayCountAvailableForBooking,
  timeZone
) => focusedInput => {
  const endOfAvailableRange = dayCountAvailableForBooking - 1;
  const outOfBookableDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange + 1, 'days');
  const timeSlotsOnSelectedMonth = pickMonthlyTimeSlots(monthlyTimeSlots, startDate, timeZone);

  // Start date selected/focused, end date missing
  const startDateSelected = isStartDateSelected(
    timeSlotsOnSelectedMonth,
    startDate,
    endDate,
    focusedInput
  );

  // Find the end of bookable range after a start date
  const endOfBookableRange = startDateSelected
    ? firstBlockedBetween(monthlyTimeSlots, startDate, outOfBookableDate, timeZone)
    : null;

  // end date is focused but no dates are selected
  const selectingEndDate =
    timeSlotsOnSelectedMonth &&
    !startDate &&
    !endDate &&
    focusedInput === END_DATE &&
    unitType === LINE_ITEM_NIGHT;
  if (selectingEndDate) {
    // if end date is being selected first, block the day after a booked date
    // (as a booking can end on the day the following booking starts)
    return day => {
      const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
      const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
      const timeSlots = pickMonthlyTimeSlots(monthlyTimeSlots, dayInListingTZ, timeZone);
      return !timeSlots.find(timeSlot => timeSlotEqualsDay(timeSlot, dayInListingTZ));
    };
  } else if (endOfBookableRange || !timeSlotsOnSelectedMonth) {
    // a next bookable range is found or time slots are not provided
    // -> booking range handles blocking dates
    return () => false;
  } else {
    // otherwise return standard timeslots check
    return day => {
      const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
      const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
      const timeSlots = pickMonthlyTimeSlots(monthlyTimeSlots, dayInListingTZ, timeZone);
      return !timeSlots.find(timeSlot => timeSlotEqualsDay(timeSlot, dayInListingTZ));
    };
  }
};

const fetchMonthData = (
  date,
  listingId,
  dayCountAvailableForBooking,
  timeZone,
  onFetchTimeSlots
) => {
  const endOfRangeDate = endOfRange(TODAY, dayCountAvailableForBooking, timeZone);

  // Don't fetch timeSlots for past months or too far in the future
  if (isInRange(date, TODAY, endOfRangeDate)) {
    // Use "today", if the first day of given month is in the past
    const start = isDateSameOrAfter(TODAY, date) ? TODAY : date;

    // Use endOfRangeDate, if the first day of the next month is too far in the future
    const nextMonthDate = nextMonthFn(date, timeZone);
    const end = isDateSameOrAfter(nextMonthDate, endOfRangeDate)
      ? getStartOf(endOfRangeDate, 'day', timeZone)
      : nextMonthDate;

    // Fetch time slots for given time range
    onFetchTimeSlots(listingId, start, end, timeZone);
  }
};

const handleMonthClick = (
  currentMonth,
  monthlyTimeSlots,
  fetchMonthData,
  dayCountAvailableForBooking,
  timeZone,
  listingId,
  onFetchTimeSlots
) => monthFn => {
  // Callback function after month has been updated.
  // react-dates component has next and previous months ready (but inivisible).
  // we try to populate those invisible months before user advances there.
  fetchMonthData(
    monthFn(currentMonth, timeZone, 2),
    listingId,
    dayCountAvailableForBooking,
    timeZone,
    onFetchTimeSlots
  );

  // If previous fetch for month data failed, try again.
  const monthId = monthIdString(currentMonth, timeZone);
  const currentMonthData = monthlyTimeSlots[monthId];
  if (currentMonthData && currentMonthData.fetchTimeSlotsError) {
    fetchMonthData(
      currentMonth,
      listingId,
      dayCountAvailableForBooking,
      timeZone,
      onFetchTimeSlots
    );
  }
};

// In case start or end date for the booking is missing
// focus on that input, otherwise continue with the
// default handleSubmit function.
const handleFormSubmit = (setFocusedInput, onSubmit) => e => {
  const { startDate, endDate } = e.bookingDates || {};
  if (!startDate) {
    e.preventDefault();
    setFocusedInput(START_DATE);
  } else if (!endDate) {
    e.preventDefault();
    setFocusedInput(END_DATE);
  } else {
    onSubmit(e);
  }
};

// Function that can be passed to nested components
// so that they can notify this component when the
// focused input changes.
const handleFocusedInputChange = setFocusedInput => focusedInput => {
  setFocusedInput(focusedInput);
};

// When the values of the form are updated we need to fetch
// lineItems from this Template's backend for the EstimatedTransactionMaybe
// In case you add more fields to the form, make sure you add
// the values here to the orderData object.
const handleFormSpyChange = (
  listingId,
  isOwnListing,
  fetchLineItemsInProgress,
  onFetchTransactionLineItems
) => formValues => {
  const { startDate, endDate } =
    formValues.values && formValues.values.bookingDates ? formValues.values.bookingDates : {};
  const { additionalGuest, extraPerk } = formValues.values || {};

  if (
    startDate &&
    endDate &&
    // additionalGuest &&
    // isArray(extraPerk) &&
    // extraPerk.length &&
    !fetchLineItemsInProgress
  ) {
    onFetchTransactionLineItems({
      orderData: {
        bookingStart: startDate,
        bookingEnd: endDate,
        additionalGuest,
        extraPerk,
      },
      listingId,
      isOwnListing,
    });
  }
};

// IconArrowHead component might not be defined if exposed directly to the file.
// This component is called before IconArrowHead component in components/index.js
const PrevIcon = props => (
  <IconArrowHead {...props} direction="left" rootClassName={css.arrowIcon} />
);
const NextIcon = props => (
  <IconArrowHead {...props} direction="right" rootClassName={css.arrowIcon} />
);

const Next = props => {
  const { currentMonth, dayCountAvailableForBooking, timeZone } = props;
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return isDateSameOrAfter(
    nextMonthDate,
    endOfRange(TODAY, dayCountAvailableForBooking, timeZone)
  ) ? null : (
    <NextIcon />
  );
};
const Prev = props => {
  const { currentMonth, timeZone } = props;
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);

  return isDateSameOrAfter(prevMonthDate, currentMonthDate) ? <PrevIcon /> : null;
};

export const BookingDatesFormComponent = props => {
  const [focusedInput, setFocusedInput] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', props.timeZone));
  const [extraPerk, setExtraPerk] = useState([]);

  const { extraParkValues } = props;

  const handleSetExtraPerk = val => {
    setExtraPerk(val);
  };

  // const extraParkValues = findOptionsForSelectFilter('extraParkValues', config.custom.filters);
  // const extraParkValues = [
  //   { key: 'Lunch Buffet / $30', label: 'Lunch Buffet / $30', value: 30 },
  //   { key: 'Hike equipment helmut / $25', label: 'Hike equipment helmut / $25', value: 25 },
  //   { key: 'Photographs of you hiking / $15', label: 'Photographs of you hiking / $15', value: 15 },
  // ];

  useEffect(() => {
    // Call onMonthChanged function if it has been passed in among props.
    if (props.onMonthChanged) {
      props.onMonthChanged(monthId);
    }
  }, [currentMonth]);

  const {
    rootClassName,
    className,
    price: unitPrice,
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    onSubmit,
    timeZone,
    dayCountAvailableForBooking,
    marketplaceName,
    monthlyTimeSlots,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const onFormSubmit = handleFormSubmit(setFocusedInput, onSubmit);
  const onFocusedInputChange = handleFocusedInputChange(setFocusedInput);
  const onFormSpyChange = handleFormSpyChange(
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems
  );

  return (
    <FinalForm
      {...rest}
      unitPrice={unitPrice}
      onSubmit={onFormSubmit}
      render={fieldRenderProps => {
        const {
          endDatePlaceholder,
          startDatePlaceholder,
          formId,
          handleSubmit,
          intl,
          lineItemUnitType,
          values,
          monthlyTimeSlots,
          lineItems,
          fetchLineItemsError,
          onFetchTimeSlots,
          form,
          userNativeLang,
        } = fieldRenderProps;

        const { startDate, endDate } = values && values.bookingDates ? values.bookingDates : {};
        const startDateErrorMessage = intl.formatMessage({
          id: 'FieldDateRangeInput.invalidStartDate',
        });
        const endDateErrorMessage = intl.formatMessage({
          id: 'FieldDateRangeInput.invalidEndDate',
        });
        const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

        // This is the place to collect breakdown estimation data.
        // Note: lineItems are calculated and fetched from this Template's backend
        // so we need to pass only booking data that is needed otherwise
        // If you have added new fields to the form that will affect to pricing,
        // you need to add the values to handleOnChange function
        const breakdownData =
          startDate && endDate
            ? {
                startDate,
                endDate,
              }
            : null;

        const showEstimatedBreakdown =
          breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;

        const dateFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        };

        const formatFieldDateInput = timeZone => v =>
          v && v.date ? { date: timeOfDayFromTimeZoneToLocal(v.date, timeZone) } : { date: v };

        const startOfToday = getStartOf(TODAY, 'day', timeZone);
        const tomorrow = addTime(startOfToday, 1, 'days');
        const startDatePlaceholderText =
          startDatePlaceholder || intl.formatDate(startOfToday, dateFormatOptions);
        const endDatePlaceholderText =
          endDatePlaceholder || intl.formatDate(tomorrow, dateFormatOptions);

        const onMonthClick = handleMonthClick(
          currentMonth,
          monthlyTimeSlots,
          fetchMonthData,
          dayCountAvailableForBooking,
          timeZone,
          listingId,
          onFetchTimeSlots
        );
        const isDayBlocked = isDayBlockedFn(
          monthlyTimeSlots,
          startDate,
          endDate,
          lineItemUnitType,
          dayCountAvailableForBooking,
          timeZone
        );
        const isOutsideRange = isOutsideRangeFn(
          monthlyTimeSlots,
          startDate,
          endDate,
          lineItemUnitType,
          dayCountAvailableForBooking,
          timeZone
        );

        const selectDateLabel = 'Select Date';

        const onExceptionStartDateChange = (value, dayCountAvailableForBooking, props) => {
          const { timeZone, intl, formApi } = props;

          if (!value || !value.date) {
            formApi.batch(() => {
              formApi.change('exceptionStartTime', null);
              formApi.change('exceptionEndDate', { date: null });
              formApi.change('exceptionEndTime', null);
            });
            return;
          }

          // This callback function is called from react-dates component.
          // It gets raw value as a param - browser's local time instead of time in listing's timezone.
          const selectedStartDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);
          const dayData =
            dayCountAvailableForBooking[stringifyDateToISO8601(selectedStartDate, timeZone)];
          const availableSlots = dayData.slots || [];
          const params = { intl, timeZone, availableSlots, selectedStartDate };
          const { startTime, endDate, endTime } = getAllTimeValues(params);

          formApi.batch(() => {
            formApi.change('exceptionStartTime', startTime);
            formApi.change('exceptionEndDate', { date: endDate });
            formApi.change('exceptionEndTime', endTime);
          });
        };

        const singleDateChange = (value, form, props) => {
          const { timeZone, intl } = props;
          form.batch(() => {
            // form.change('selectedbookingDates', { date: value.date, endDate: value.date });
            form.change('bookingDates', {
              startDate: value.date,
              endDate: new Date(
                moment(value.date)
                  .add(1, 'days')
                  .format()
              ),
            });
          });
        };

        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            <FormSpy subscription={{ values: true }} onChange={onFormSpyChange} />
            {/* <FieldDateRangeInput
              className={css.bookingDates}
              name="bookingDates"
              isDaily={lineItemUnitType === LINE_ITEM_DAY}
              startDateId={`${formId}.bookingStartDate`}
              startDateLabel={intl.formatMessage({
                id: 'BookingDatesForm.bookingStartTitle',
              })}
              startDatePlaceholderText={startDatePlaceholderText}
              endDateId={`${formId}.bookingEndDate`}
              endDateLabel={intl.formatMessage({
                id: 'BookingDatesForm.bookingEndTitle',
              })}
              endDatePlaceholderText={endDatePlaceholderText}
              focusedInput={focusedInput}
              onFocusedInputChange={onFocusedInputChange}
              format={v => {
                const { startDate, endDate } = v || {};
                // Format the Final Form field's value for the DateRangeInput
                // DateRangeInput operates on local time zone, but the form uses listing's time zone
                const formattedStart = startDate
                  ? timeOfDayFromTimeZoneToLocal(startDate, timeZone)
                  : startDate;
                const formattedEnd = endDate
                  ? timeOfDayFromTimeZoneToLocal(endDate, timeZone)
                  : endDate;
                return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
              }}
              parse={v => {
                const { startDate, endDate } = v || {};
                // Parse the DateRangeInput's value (local noon) for the Final Form
                // The form expects listing's time zone and start of day aka 00:00
                const parsedStart = startDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
                  : startDate;
                const parsedEnd = endDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
                  : endDate;
                return v ? { startDate: parsedStart, endDate: parsedEnd } : v;
              }}
              useMobileMargins
              validate={composeValidators(
                required(
                  intl.formatMessage({
                    id: 'BookingDatesForm.requiredDate',
                  })
                ),
                bookingDatesRequired(startDateErrorMessage, endDateErrorMessage)
              )}
              initialVisibleMonth={initialVisibleMonth(startDate || startOfToday, timeZone)}
              navNext={
                <Next
                  currentMonth={currentMonth}
                  timeZone={timeZone}
                  dayCountAvailableForBooking={dayCountAvailableForBooking}
                />
              }
              navPrev={<Prev currentMonth={currentMonth} timeZone={timeZone} />}
              onPrevMonthClick={() => {
                setCurrentMonth(prevMonth => prevMonthFn(prevMonth, timeZone));
                onMonthClick(prevMonthFn);
              }}
              onNextMonthClick={() => {
                setCurrentMonth(prevMonth => nextMonthFn(prevMonth, timeZone));
                onMonthClick(nextMonthFn);
              }}
              isDayBlocked={isDayBlocked}
              isOutsideRange={isOutsideRange}
              isBlockedBetween={isBlockedBetween(monthlyTimeSlots, timeZone)}
              disabled={fetchLineItemsInProgress}
              onClose={event =>
                setCurrentMonth(getStartOf(event?.startDate ?? startOfToday, 'month', timeZone))
              }
              form={form}
            /> */}

            {/* <FieldDateInput
              id={`startDate`}
              name={`startDate`}
              // className={classNames(css.datefield, textfield)}
              label={selectDateLabel}
              // validate={startTitleValidator}
              // errorClassName={errorTextField}
              userNativeLang={userNativeLang}
              // placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
              // format={formatFieldDateInput(timeZone)}
              // parse={parseFieldDateInput(timeZone)}

              format={v => {
                const { startDate, endDate } = v || {};
                // Format the Final Form field's value for the DateRangeInput
                // DateRangeInput operates on local time zone, but the form uses listing's time zone
                const formattedStart = startDate
                  ? timeOfDayFromTimeZoneToLocal(startDate, timeZone)
                  : startDate;
                const formattedEnd = endDate
                  ? timeOfDayFromTimeZoneToLocal(endDate, timeZone)
                  : endDate;
                return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
              }}
              parse={v => {
                const { startDate, endDate } = v || {};
                // Parse the DateRangeInput's value (local noon) for the Final Form
                // The form expects listing's time zone and start of day aka 00:00
                const parsedStart = startDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
                  : startDate;
                const parsedEnd = endDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
                  : endDate;
                return v ? { startDate: parsedStart, endDate: parsedEnd } : v;
              }}
              useMobileMargins
              validate={composeValidators(
                required(
                  intl.formatMessage({
                    id: 'BookingDatesForm.requiredDate',
                  })
                ),
                bookingDatesRequired(startDateErrorMessage, endDateErrorMessage)
              )}
              initialVisibleMonth={initialVisibleMonth(startDate || startOfToday, timeZone)}
              navNext={
                <Next
                  currentMonth={currentMonth}
                  timeZone={timeZone}
                  dayCountAvailableForBooking={dayCountAvailableForBooking}
                />
              }
              navPrev={<Prev currentMonth={currentMonth} timeZone={timeZone} />}
              onPrevMonthClick={() => {
                setCurrentMonth(prevMonth => prevMonthFn(prevMonth, timeZone));
                onMonthClick(prevMonthFn);
              }}
              onNextMonthClick={() => {
                setCurrentMonth(prevMonth => nextMonthFn(prevMonth, timeZone));
                onMonthClick(nextMonthFn);
              }}
              isDayBlocked={isDayBlocked}
              isOutsideRange={isOutsideRange}
              isBlockedBetween={isBlockedBetween(monthlyTimeSlots, timeZone)}
              disabled={fetchLineItemsInProgress}
              onClose={event =>
                setCurrentMonth(getStartOf(event?.startDate ?? startOfToday, 'month', timeZone))
              }
              form={form}
              //  min={minStartDate.toDate()}
              // isDayBlocked={
              //   date => moment(date).isBefore(minStartDate, 'day')

              //   // to block current date and selected days
              //   // selectedDates.some(selectedDate =>
              //   //   moment(date).isSame(moment(selectedDate.date), 'day')
              //   // ) || moment(date).isSame(moment(), 'day')
              // }
              // onChange={date => {
              //   form.change(`${fieldName}.startTime.hours`, '');
              //   form.change(`${fieldName}.startTime.min`, '');

              //   form.change(`${fieldName}.endTime.hours`, '');
              //   form.change(`${fieldName}.endTime.min`, '');
              //   //  handleSelectedDateChange(fieldName, date.date);
              //   const selectedDateTime = moment(date.date).isSame(
              //     minStartDate,
              //     'date'
              //   )
              //     ? moment(date.date).set({
              //         hours: minStartDate.hour(),
              //         minutes: minStartDate.minute(),
              //         seconds: 0,
              //       })
              //     : moment(date.date).set({
              //         hours: 0,
              //         minutes: 0,
              //       });
              //   handleStartTimeOptions(selectedDateTime, minStartDate);

              //   // console.log(
              //   //   99999,
              //   //   moment(date.date).isSame(minStartDate, 'date'),
              //   //   selectedDateTime.format(),
              //   //   minStartDate.format(),
              //   //   moment(selectedDateTime).isAfter(minStartDate),
              //   //   moment(selectedDateTime).isAfter(minStartDate, 'date')
              //   //   // isSelectedDateAfterMinStartDate
              //   // );
              // }}
            /> */}

            {/* <FieldDateInput
              className={css.fieldDateInput}
              name="exceptionStartDate"
              id="exceptionStartDate"
              label={intl.formatMessage({
                id: 'EditListingAvailabilityExceptionForm.exceptionStartDateLabel',
              })}
              placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
              format={v => {
                const { startDate, endDate } = v || {};
                // Format the Final Form field's value for the DateRangeInput
                // DateRangeInput operates on local time zone, but the form uses listing's time zone
                const formattedStart = startDate
                  ? timeOfDayFromTimeZoneToLocal(startDate, timeZone)
                  : startDate;
                const formattedEnd = endDate
                  ? timeOfDayFromTimeZoneToLocal(endDate, timeZone)
                  : endDate;
                return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
              }}
              parse={v => {
                const { startDate, endDate } = v || {};
                console.log(1112, startDate, endDate);
                // Parse the DateRangeInput's value (local noon) for the Final Form
                // The form expects listing's time zone and start of day aka 00:00
                const parsedStart = startDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
                  : startDate;
                const parsedEnd = endDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
                  : endDate;
                return v ? { startDate: parsedStart, endDate: parsedEnd } : v;
              }}
              // isDayBlocked={isDayBlocked}
              // isOutsideRange={isOutsideRange}
              onChange={value =>
                onExceptionStartDateChange(value, dayCountAvailableForBooking, props)
              }
              onPrevMonthClick={() => {
                setCurrentMonth(prevMonth => prevMonthFn(prevMonth, timeZone));
                onMonthClick(prevMonthFn);
              }}
              onNextMonthClick={() => {
                setCurrentMonth(prevMonth => nextMonthFn(prevMonth, timeZone));
                onMonthClick(nextMonthFn);
              }}
              initialVisibleMonth={initialVisibleMonth(startDate || startOfToday, timeZone)}
              navNext={
                <Next
                  currentMonth={currentMonth}
                  timeZone={timeZone}
                  dayCountAvailableForBooking={dayCountAvailableForBooking}
                />
              }
              navPrev={<Prev currentMonth={currentMonth} timeZone={timeZone} />}
              useMobileMargins
              showErrorMessage={false}
              // validate={bookingDateRequired('Required')}
            /> */}

            <FieldDateInput
              name="selectedbookingDates"
              id="selectedbookingDates"
              // name="bookingDates"
              // id="bookingDates"
              placeholderText={intl.formatDate(
                values.bookingDates?.startDate || TODAY,
                dateFormattingOptions
              )}
              label={selectDateLabel}
              // validate={birthdateValidator}
              //  className={classNames(textfield, css.dateInputDiv)}
              //  errorClassName={errorTextField}
              // isOutsideRange={date => moment().diff(date, 'days') <= 0}

              isDayBlocked={day => {
                const monthlyTimeSlots = props.monthlyTimeSlots;
                const key = moment(day)?.format('YYYY-MM');
                console.log(121, moment(day).format(), key);
                const matchedData = monthlyTimeSlots[key]?.timeSlots;
                const dataMatchedArray = matchedData?.filter(
                  slot =>
                    moment(day).isBetween(slot.attributes.start, slot.attributes.end, 'day') ||
                    moment(day).isSame(slot.attributes.start, 'day') ||
                    moment(day).isSame(slot.attributes.end, 'day')
                );
                if (dataMatchedArray?.length > 0) {
                  return false;
                } else {
                  return true;
                }
              }}
              // isOutsideRange={isOutsideRange}
              onChange={value => singleDateChange(value, form, props)}
              // format={v => {
              //   const { date } = v || {};
              //   const startDate = date;
              //   const endDate = new Date(
              //     moment(date)
              //       .add(1, 'days')
              //       .format()
              //   );
              //   // Format the Final Form field's value for the DateRangeInput
              //   // DateRangeInput operates on local time zone, but the form uses listing's time zone
              //   const formattedStart = startDate
              //     ? timeOfDayFromTimeZoneToLocal(startDate, timeZone)
              //     : startDate;
              //   const formattedEnd = endDate
              //     ? timeOfDayFromTimeZoneToLocal(endDate, timeZone)
              //     : endDate;
              //   return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
              // }}
              // parse={v => {
              //   const { date } = v || {};
              //   const startDate = date;
              //   const endDate = new Date(
              //     moment(date)
              //       .add(1, 'days')
              //       .format()
              //   );
              //   // Parse the DateRangeInput's value (local noon) for the Final Form
              //   // The form expects listing's time zone and start of day aka 00:00
              //   const parsedStart = startDate
              //     ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
              //     : startDate;
              //   const parsedEnd = endDate
              //     ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
              //     : endDate;
              //   return v ? { startDate: parsedStart, endDate: parsedEnd } : v;
              // }}
              initialVisibleMonth={initialVisibleMonth(startDate || startOfToday, timeZone)}
              // navNext={
              //   <Next
              //     currentMonth={currentMonth}
              //     timeZone={timeZone}
              //     dayCountAvailableForBooking={dayCountAvailableForBooking}
              //   />
              // }
              // navPrev={<Prev currentMonth={currentMonth} timeZone={timeZone} />}
              // onPrevMonthClick={() => {
              //   setCurrentMonth(prevMonth => prevMonthFn(prevMonth, timeZone));
              //   onMonthClick(prevMonthFn);
              // }}
              // onNextMonthClick={() => {
              //   setCurrentMonth(prevMonth => nextMonthFn(prevMonth, timeZone));
              //   onMonthClick(nextMonthFn);
              // }}
              //
              // isBlockedBetween={isBlockedBetween(monthlyTimeSlots, timeZone)}
              // disabled={fetchLineItemsInProgress}
              onClose={event =>
                setCurrentMonth(getStartOf(event?.startDate ?? startOfToday, 'month', timeZone))
              }
            />
            <div className={css.muiselectcontainer}>
              <MuiMultiSelect
                value={extraPerk}
                setValue={val => {
                  handleSetExtraPerk(val);
                  form.change('extraPerk', val);
                }}
                datas={extraParkValues}
                placeholdertext={'Add extra perk'}
                label={'Add extra perks?'}
              />
            </div>

            <FieldTextInput
              type="number"
              name="additionalGuest"
              id="additionalGuest"
              isDayBlocked={isDayBlocked}
              // isOutsideRange={isOutsideRange}
              label="Additional Guests"
              placeholder={'Enter additional guests'}
              // validate={required}
              // className={css.nameFields}
            />

            {showEstimatedBreakdown ? (
              <div className={css.priceBreakdownContainer}>
                <H6 as="h3" className={css.bookingBreakdownTitle}>
                  <FormattedMessage id="BookingDatesForm.priceBreakdownTitle" />
                </H6>
                <hr className={css.totalDivider} />
                <EstimatedCustomerBreakdownMaybe
                  breakdownData={breakdownData}
                  lineItems={lineItems}
                  timeZone={timeZone}
                  currency={unitPrice.currency}
                  marketplaceName={marketplaceName}
                  processName={ADVENTURELY_PROCESS_NAME}
                />
              </div>
            ) : null}
            {fetchLineItemsError ? (
              <span className={css.sideBarError}>
                <FormattedMessage id="BookingDatesForm.fetchLineItemsError" />
              </span>
            ) : null}

            <div className={css.submitButton}>
              <PrimaryButton type="submit" inProgress={fetchLineItemsInProgress}>
                <FormattedMessage id="BookingDatesForm.requestToBook" />
              </PrimaryButton>
            </div>
            <p className={css.finePrint}>
              <FormattedMessage
                id={
                  isOwnListing
                    ? 'BookingDatesForm.ownListing'
                    : 'BookingDatesForm.youWontBeChargedInfo'
                }
              />
            </p>
          </Form>
        );
      }}
    />
  );
};

BookingDatesFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  price: null,
  isOwnListing: false,
  startDatePlaceholder: null,
  endDatePlaceholder: null,
  lineItems: null,
  fetchLineItemsError: null,
  monthlyTimeSlots: null,
};

BookingDatesFormComponent.propTypes = {
  rootClassName: string,
  className: string,

  marketplaceName: string.isRequired,
  lineItemUnitType: propTypes.lineItemUnitType.isRequired,
  price: propTypes.money,
  isOwnListing: bool,
  monthlyTimeSlots: object,
  onFetchTimeSlots: func.isRequired,

  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,

  // for tests
  startDatePlaceholder: string,
  endDatePlaceholder: string,
  dayCountAvailableForBooking: number.isRequired,
};

const BookingDatesForm = compose(injectIntl)(BookingDatesFormComponent);
BookingDatesForm.displayName = 'BookingDatesForm';

export default BookingDatesForm;
