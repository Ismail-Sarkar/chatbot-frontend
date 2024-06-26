import React, { Component } from 'react';
import { arrayOf, bool, func, node, number, object, string } from 'prop-types';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { parseDateFromISO8601, stringifyDateToISO8601 } from '../../../util/dates';

import { FieldDateInput, FieldDateRangeController } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import FilterPopupForSidebar from './FilterPopupForSidebar';
import css from './BookingDateRangeFilter.module.css';
import moment from 'moment';
import { compose } from 'redux';
import { withViewport } from '../../../util/uiHelpers';

const getDatesQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
    ? queryParamNames
    : 'dates';
};

// Parse query parameter, which should look like "2020-05-28,2020-05-31"
const parseValue = value => {
  const rawValuesFromParams = value ? value.split(',') : [];
  const [startDate, endDate] = rawValuesFromParams.map(v => parseDateFromISO8601(v));
  //   return value && startDate && endDate ? { dates: { startDate, endDate } } : { dates: null };
  return value && startDate && endDate
    ? { dates: { startDate, endDate, date: startDate } }
    : { dates: null };
};
// Format dateRange value for the query. It's given by FieldDateRangeInput:
// { dates: { startDate, endDate } }
const formatValue = (dateRange, queryParamName) => {
  const hasDates = dateRange && dateRange.dates;
  //   const { startDate, endDate } = hasDates ? dateRange.dates : {};
  //   const start = startDate ? stringifyDateToISO8601(startDate) : null;
  //   const end = endDate ? stringifyDateToISO8601(endDate) : null;
  //   const value = start && end ? `${start},${end}` : null;

  const { date: startDate } = hasDates ? dateRange.dates : {};
  const start = startDate ? stringifyDateToISO8601(startDate) : null;
  const value = start ? `${start},${start}` : null;
  return { [queryParamName]: value };
};

const MAX_MOBILE_SCREEN_WIDTH = 768;

export class BookingDateRangeFilterComponent extends Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: true, selectedDate: null };

    this.popupControllerRef = null;
    this.plainControllerRef = null;

    this.toggleIsOpen = this.toggleIsOpen.bind(this);
  }
  toggleIsOpen() {
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
  }

  render() {
    const {
      className,
      rootClassName,
      showAsPopup,
      isDesktop,
      initialValues,
      id,
      contentPlacementOffset,
      onSubmit,
      queryParamNames,
      label,
      intl,
      minimumNights,
      viewport,
      ...rest
    } = this.props;

    const isMobileLayout = viewport.width < MAX_MOBILE_SCREEN_WIDTH;

    const datesQueryParamName = getDatesQueryParamName(queryParamNames);
    const initialDates =
      initialValues && initialValues[datesQueryParamName]
        ? parseValue(initialValues[datesQueryParamName])
        : { dates: null };

    const isSelected = !!initialDates.dates;
    const startDate = isSelected ? initialDates.dates.startDate : null;
    const endDate = isSelected ? initialDates.dates.endDate : null;

    const format = {
      month: 'short',
      day: 'numeric',
    };

    const formattedStartDate = isSelected ? intl.formatDate(startDate, format) : null;
    const formattedEndDate = isSelected ? intl.formatDate(endDate, format) : null;

    const labelForPlain = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPlain' },
          {
            dates: `${formattedStartDate} `,
          }
        )
      : label
      ? label
      : intl.formatMessage({ id: 'BookingDateRangeFilter.labelPlain' });

    const labelForPopup = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPopup' },
          {
            dates: `${formattedStartDate} `,
          }
        )
      : label
      ? label
      : intl.formatMessage({ id: 'BookingDateRangeFilter.labelPopup' });

    const labelSelection = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPopup' },
          {
            dates: `${formattedStartDate} `,
          }
        )
      : null;
    const handleSubmit = values => {
      onSubmit(
        values && values.dates //&& this.state.selectedDate
          ? formatValue(
              {
                ...values,
                dates: {
                  ...values?.dates,
                  date: isMobileLayout ? values.dates.date : new Date(this.state.selectedDate),
                },
              },
              datesQueryParamName
            )
          : formatValue(null, datesQueryParamName)
      );
    };

    const onClearPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? {
            onClear: () => {
              this.setState({ selectedDate: null }, () =>
                this.popupControllerRef.onReset(null, null)
              );
            },
          }
        : {};

    const onCancelPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? {
            onCancel: () => {
              this.setState({ selectedDate: null }, () =>
                this.popupControllerRef.onReset(null, null)
              );
            },
          }
        : {};

    const onClearPlainMaybe =
      this.plainControllerRef && this.plainControllerRef.onReset
        ? {
            onClear: () => {
              this.setState({ selectedDate: null }, () =>
                this.plainControllerRef.onReset(null, null)
              );
            },
          }
        : {};

    return showAsPopup ? (
      <FilterPopup
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={labelForPopup}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDates}
        {...rest}
      >
        {/* <FieldDateRangeController
          name="dates"
          minimumNights={minimumNights}
          controllerRef={node => {
            this.popupControllerRef = node;
          }}
        /> */}
        <div className={css.calenderDateContainer}>
          <FieldDateInput
            dateClassName={css.inboxPageCalender}
            name="dates"
            placeholderText={`Date`}
            controllerRef={node => {
              this.popupControllerRef = node;
            }}
            keepOpenCalender={true}
            keepOpenOnDateSelect={true}
            firstDayOfWeek={0}
            weekDayFormat="ddd"
            isDayHighlighted={day => {
              const formatedDate = moment(day).format('YYYY-MM-DD');

              return moment(formatedDate).isSame(this.state.selectedDate);
            }}
            onChange={value => {
              this.setState({
                selectedDate: moment(value.date).format('YYYY-MM-DD'),
              });
            }}
          />
        </div>
      </FilterPopup>
    ) : isDesktop ? (
      <FilterPopupForSidebar
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={label}
        labelSelection={labelSelection}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDates}
        {...rest}
      >
        <div className={css.calenderDateContainer}>
          <FieldDateInput
            dateClassName={css.inboxPageCalender}
            name="dates"
            placeholderText={`Date`}
            controllerRef={node => {
              this.popupControllerRef = node;
            }}
            keepOpenCalender={true}
            keepOpenOnDateSelect={true}
            firstDayOfWeek={0}
            weekDayFormat="ddd"
            isDayHighlighted={day => {
              const formatedDate = moment(day).format('YYYY-MM-DD');

              return moment(formatedDate).isSame(this.state.selectedDate);
            }}
            onChange={value => {
              this.setState({
                selectedDate: moment(value.date).format('YYYY-MM-DD'),
              });
            }}
          />
        </div>
      </FilterPopupForSidebar>
    ) : (
      <FilterPlain
        className={className}
        rootClassName={rootClassName}
        label={label}
        labelSelection={labelSelection}
        labelSelectionSeparator=":"
        isSelected={isSelected}
        id={`${id}.plain`}
        liveEdit
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPlainMaybe}
        initialValues={initialDates}
        {...rest}
      >
        <div className={css.calenderDateContainer}>
          <FieldDateInput
            dateClassName={css.inboxPageCalender}
            name="dates"
            placeholderText={`Date`}
            controllerRef={node => {
              this.popupControllerRef = node;
            }}
            keepOpenCalender={true}
            keepOpenOnDateSelect={true}
            firstDayOfWeek={0}
            weekDayFormat="ddd"
            isDayHighlighted={day => {
              const formatedDate = moment(day).format('YYYY-MM-DD');

              return moment(formatedDate).isSame(this.state.selectedDate);
            }}
            onChange={value => {
              this.setState({
                selectedDate: moment(value.date).format('YYYY-MM-DD'),
              });
            }}
          />
        </div>
      </FilterPlain>
    );
  }
}

BookingDateRangeFilterComponent.defaultProps = {
  rootClassName: null,
  className: null,
  showAsPopup: true,
  liveEdit: false,
  minimumNights: 0,
  initialValues: null,
  contentPlacementOffset: 0,
};

BookingDateRangeFilterComponent.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  label: node,
  showAsPopup: bool,
  liveEdit: bool,
  queryParamNames: arrayOf(string).isRequired,
  onSubmit: func.isRequired,
  minimumNights: number,
  initialValues: object,
  contentPlacementOffset: number,

  // form injectIntl
  intl: intlShape.isRequired,
};

const BookingDateRangeFilter2 = compose(injectIntl, withViewport)(BookingDateRangeFilterComponent);

export default BookingDateRangeFilter2;
