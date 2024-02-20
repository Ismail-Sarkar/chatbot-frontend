import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { arrayOf, bool, func, object, string } from 'prop-types';
import classNames from 'classnames';
import { EditorState, convertFromHTML, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { getDefaultTimeZoneOnBrowser, timestampToDate } from '../../../../util/dates';
import { LISTING_STATE_DRAFT, propTypes } from '../../../../util/types';
import * as validators from '../../../../util/validators';

import { DAY, isFullDay } from '../../../../transactions/transaction';

// Import shared components
import {
  Button,
  FieldCheckboxGroup,
  H3,
  InlineTextButton,
  ListingLink,
  Modal,
} from '../../../../components';

// Import modules from this directory
import EditListingAvailabilityPlanForm from './EditListingAvailabilityPlanForm';
import EditListingAvailabilityExceptionForm from './EditListingAvailabilityExceptionForm';
import WeeklyCalendar from './WeeklyCalendar/WeeklyCalendar';
import Select from 'react-select';
import css from './EditListingAvailabilityPanel.module.css';
import { createInstance, types as sdkTypes } from '../../../../util/sdkLoader';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../../../util/urlHelpers';
import { createResourceLocatorString } from '../../../../util/routes';
// import TextEditor from './TextEditor';
const TextEditor = lazy(() => import('./TextEditor'));
// This is the order of days as JavaScript understands them
// The number returned by "new Date().getDay()" refers to day of week starting from sunday.
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const { UUID } = sdkTypes;

// This is the order of days as JavaScript understands them
// The number returned by "new Date().getDay()" refers to day of week starting from sunday.
const rotateDays = (days, startOfWeek) => {
  return startOfWeek === 0 ? days : days.slice(startOfWeek).concat(days.slice(0, startOfWeek));
};

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

///////////////////////////////////////////////////
// EditListingAvailabilityExceptionPanel - utils //
///////////////////////////////////////////////////

// Create initial entry mapping for form's initial values
const createEntryDayGroups = (entries = {}) => {
  // Collect info about which days are active in the availability plan form:
  let activePlanDays = [];
  return entries.reduce((groupedEntries, entry) => {
    const { startTime, endTime: endHour, dayOfWeek } = entry;
    const dayGroup = groupedEntries[dayOfWeek] || [];
    activePlanDays = activePlanDays.includes(dayOfWeek)
      ? activePlanDays
      : [...activePlanDays, dayOfWeek];
    return {
      ...groupedEntries,
      [dayOfWeek]: [
        ...dayGroup,
        {
          startTime,
          endTime: endHour === '00:00' ? '24:00' : endHour,
        },
      ],
      activePlanDays,
    };
  }, {});
};

// Create initial values
const createInitialValues = availabilityPlan => {
  const { timezone, entries } = availabilityPlan || {};
  const tz = timezone || defaultTimeZone();
  return {
    timezone: tz,
    ...createEntryDayGroups(entries),
  };
};

// Create entries from submit values
const createEntriesFromSubmitValues = (values, listing) =>
  WEEKDAYS.reduce((allEntries, dayOfWeek) => {
    const dayValues = values[dayOfWeek] || [];
    const dayEntries = dayValues.map(dayValue => {
      const { startTime, endTime } = dayValue;
      // Note: This template doesn't support seats yet.
      return startTime && endTime
        ? {
            dayOfWeek,
            seats: listing?.attributes?.publicData?.reserVations || 1,
            startTime,
            endTime: endTime === '24:00' ? '00:00' : endTime,
          }
        : null;
    });

    return allEntries.concat(dayEntries.filter(e => !!e));
  }, []);

// Create availabilityPlan from submit values
const createAvailabilityPlan = (values, listing) => ({
  availabilityPlan: {
    type: 'availability-plan/time',
    timezone: values.timezone === 'America/Miami' ? 'America/New_York' : values.timezone,
    entries: createEntriesFromSubmitValues(values, listing),
  },
  privateData: {
    timezone: values.timezone,
  },
});

//////////////////////////////////
// EditListingAvailabilityPanel //
//////////////////////////////////
const EditListingAvailabilityPanel = props => {
  const {
    className,
    rootClassName,
    params,
    locationSearch,
    listing,
    monthlyExceptionQueries,
    weeklyExceptionQueries,
    allExceptions,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    disabled,
    ready,
    onFetchExceptions,
    onSubmit,
    onManageDisableScrolling,
    onNextTab,
    submitButtonText,
    updateInProgress,
    errors,
    config,
    routeConfiguration,
    history,
  } = props;
  // Hooks
  const { electricalOutletOption, rules } = config.listing || {};

  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isEditExceptionsModalOpen, setIsEditExceptionsModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);
  const [showOtherEntryRules, setShowOtherEntryRules] = useState(
    listing?.attributes?.publicData?.rulesValOption
      ? listing?.attributes?.publicData?.rulesValOption?.other
      : false
  );
  const [editorState, setEditorState] = useState(
    listing.attributes.publicData.entryRules
      ? EditorState.createWithContent(
          ContentState.createFromBlockArray(
            convertFromHTML(listing.attributes.publicData.entryRules)
          )
        )
      : EditorState.createEmpty()
  );
  // const [entryRules, setEntryRules] = useState(listing.attributes.publicData.entryRules || null);
  const [rulesVal, setRulesVal] = useState(
    rules.reduce((acc, value) => {
      acc[value.key] = listing?.attributes?.publicData?.rulesValOption
        ? listing?.attributes?.publicData?.rulesValOption[value.key]
        : false;
      return acc;
    }, {})
  );
  const [checkBoxVal, setCheckBoxVal] = useState(
    electricalOutletOption.reduce((acc, value) => {
      acc[value.key] = listing?.attributes?.publicData?.electricalOutletOption
        ? listing?.attributes?.publicData?.electricalOutletOption[value.key]
        : false;
      return acc;
    }, {})
  );
  const [allValuesFalseRef, setAllValuesFalseRef] = useState(
    Object.values(checkBoxVal).every(value => value === false)
  );
  useEffect(() => {
    const isAllFalse = Object.values(checkBoxVal).every(value => value === false);
    setAllValuesFalseRef(isAllFalse);
  }, [checkBoxVal]);
  const [startTime, setStartTime] = useState(
    listing.attributes.publicData.availableStartTime || { value: '00:00am', label: '00:00am' }
  );
  const [endTime, setEndTime] = useState(
    listing.attributes.publicData.availableEndTime || { value: '11:00pm', label: '11:00pm' }
  );
  const [sdk, setSdk] = useState(null);
  useEffect(() => {
    setSdk(createInstance({ clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID }));
  }, []);

  const timeOptions = [];
  const endTimeOptions = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 60) {
      if (hour < 12) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}am`;
        timeOptions.push({ value: time, label: time });
      } else if (hour === 12) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}pm`;
        timeOptions.push({ value: time, label: time });
      } else {
        const newHour = hour - 12;
        const time = `${newHour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}pm`;
        timeOptions.push({ value: time, label: time });
      }
    }
  }

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 60) {
      const parts = startTime?.value?.split(':');
      if (parts?.length === 2) {
        const starthour = parts[0]; // This will give you '10' as a string
        const startminute = parts[1].slice(0, 2);
        if (hour > starthour) {
          if (hour < 12) {
            const time = `${hour.toString().padStart(2, '0')}:${minute
              .toString()
              .padStart(2, '0')}am`;
            endTimeOptions.push({ value: time, label: time });
          } else if (hour === 12) {
            const time = `${hour.toString().padStart(2, '0')}:${minute
              .toString()
              .padStart(2, '0')}pm`;
            endTimeOptions.push({ value: time, label: time });
          } else {
            const newHour = hour - 12;
            const time = `${newHour.toString().padStart(2, '0')}:${minute
              .toString()
              .padStart(2, '0')}pm`;
            endTimeOptions.push({ value: time, label: time });
          }
        }
      } else {
        if (hour < 13) {
          const time = `${hour.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}am`;
          endTimeOptions.push({ value: time, label: time });
        } else {
          const newHour = hour - 12;
          const time = `${newHour.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}pm`;
          endTimeOptions.push({ value: time, label: time });
        }
      }
    }
  }
  const handleCheckboxChange = option => {
    setCheckBoxVal(checkBoxVal => ({ ...checkBoxVal, [option]: !checkBoxVal[option] }));
  };
  const handleRulesChange = option => {
    setRulesVal(rulesVal => ({ ...rulesVal, [option]: !rulesVal[option] }));
    if (option === 'other') {
      setShowOtherEntryRules(!showOtherEntryRules);
    }
  };
  const changeStartTime = startTime => {
    setStartTime(startTime);
  };
  const changeEndTime = endTime => {
    setEndTime(endTime);
  };
  const updateAndNextTab = (id, slug, editListingLinkType) => {
    sdk &&
      sdk.ownListings
        .update({
          id: new UUID(listing.id.uuid),
          publicData: {
            availableStartTime: startTime ? startTime : null,
            availableEndTime: endTime ? endTime : null,
            electricalOutletOption: checkBoxVal,
            rulesValOption: rulesVal,
            entryRules:
              showOtherEntryRules && editorState
                ? draftToHtml(convertToRaw(editorState.getCurrentContent()))
                : null,
            // entryRules: showOtherEntryRules && entryRules ? entryRules : null,
          },
        })
        .then(res => {
          editListingLinkType === 'edit'
            ? history.push(
                createResourceLocatorString(
                  'EditListingPage',
                  routeConfiguration,
                  {
                    id,
                    slug,
                    type: editListingLinkType,
                    tab: 'availability',
                  },
                  {}
                )
              )
            : onNextTab();
        });
  };

  const handleEntryRules = e => {
    setEntryRules(e.target.value);
  };

  // for (let hour = 0; hour < 24; hour++) {
  //   for (let minute = 30; minute < 60; minute += 30) {
  //     const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  //     endTimeOptions.push({ value: time, label: time });
  //   }
  // }
  const firstDayOfWeek = config.localization.firstDayOfWeek;
  const classes = classNames(rootClassName || css.root, className);
  const listingAttributes = listing?.attributes;
  const id = listing.id.uuid;
  const { title = '', state } = listing.attributes;
  const slug = createSlug(title);
  const isDraft = state === LISTING_STATE_DRAFT;
  const editListingLinkType = isDraft
    ? LISTING_PAGE_PARAM_TYPE_DRAFT
    : LISTING_PAGE_PARAM_TYPE_EDIT;

  const unitType = listingAttributes?.publicData?.unitType;
  const useFullDays = isFullDay(unitType);
  const hasAvailabilityPlan = !!listingAttributes?.availabilityPlan;
  const isPublished = listing?.id && listingAttributes?.state !== LISTING_STATE_DRAFT;
  const defaultAvailabilityPlan = {
    type: 'availability-plan/time',
    timezone: defaultTimeZone(),
    entries: [
      // { dayOfWeek: 'mon', startTime: '09:00', endTime: '17:00', seats: 1 },
      // { dayOfWeek: 'tue', startTime: '09:00', endTime: '17:00', seats: 1 },
      // { dayOfWeek: 'wed', startTime: '09:00', endTime: '17:00', seats: 1 },
      // { dayOfWeek: 'thu', startTime: '09:00', endTime: '17:00', seats: 1 },
      // { dayOfWeek: 'fri', startTime: '09:00', endTime: '17:00', seats: 1 },
      // { dayOfWeek: 'sat', startTime: '09:00', endTime: '17:00', seats: 1 },
      // { dayOfWeek: 'sun', startTime: '09:00', endTime: '17:00', seats: 1 },
    ],
  };
  const availabilityPlan = listingAttributes?.availabilityPlan || defaultAvailabilityPlan;

  const initialValues = valuesFromLastSubmit
    ? valuesFromLastSubmit
    : createInitialValues(availabilityPlan);

  const handleSubmit = values => {
    setValuesFromLastSubmit(values);

    // Final Form can wait for Promises to return.
    return onSubmit(createAvailabilityPlan(values, listing))
      .then(() => {
        setIsEditPlanModalOpen(false);
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  const sortedAvailabilityExceptions = allExceptions;

  // Save exception click handler
  const saveException = values => {
    const { availability, exceptionStartTime, exceptionEndTime, exceptionRange } = values;

    // TODO: add proper seat handling
    const seats = availability === 'available' ? 1 : 0;

    // Exception date/time range is given through FieldDateRangeInput or
    // separate time fields.
    const range = useFullDays
      ? {
          start: exceptionRange?.startDate,
          end: exceptionRange?.endDate,
        }
      : {
          start: timestampToDate(exceptionStartTime),
          end: timestampToDate(exceptionEndTime),
        };

    const params = {
      listingId: listing.id,
      seats,
      ...range,
    };

    return onAddAvailabilityException(params)
      .then(() => {
        setIsEditExceptionsModalOpen(false);
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  return (
    <main className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingAvailabilityPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingAvailabilityPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>

      <div className={css.planInfo}>
        {!hasAvailabilityPlan ? (
          <p>
            <FormattedMessage id="EditListingAvailabilityPanel.availabilityPlanInfo" />
          </p>
        ) : null}

        <InlineTextButton
          className={css.editPlanButton}
          onClick={() => setIsEditPlanModalOpen(true)}
        >
          {hasAvailabilityPlan ? (
            <FormattedMessage id="EditListingAvailabilityPanel.editAvailabilityPlan" />
          ) : (
            <FormattedMessage id="EditListingAvailabilityPanel.setAvailabilityPlan" />
          )}
        </InlineTextButton>
      </div>

      {hasAvailabilityPlan ? (
        <>
          <WeeklyCalendar
            className={css.section}
            headerClassName={css.sectionHeader}
            listingId={listing.id}
            availabilityPlan={availabilityPlan}
            availabilityExceptions={sortedAvailabilityExceptions}
            weeklyExceptionQueries={weeklyExceptionQueries}
            isDaily={unitType === DAY}
            useFullDays={useFullDays}
            onDeleteAvailabilityException={onDeleteAvailabilityException}
            onFetchExceptions={onFetchExceptions}
            params={params}
            locationSearch={locationSearch}
            firstDayOfWeek={firstDayOfWeek}
            routeConfiguration={routeConfiguration}
            history={history}
          />

          <section className={css.section}>
            <InlineTextButton
              className={css.addExceptionButton}
              onClick={() => setIsEditExceptionsModalOpen(true)}
              disabled={disabled || !hasAvailabilityPlan}
              ready={ready}
            >
              <FormattedMessage id="EditListingAvailabilityPanel.addException" />
            </InlineTextButton>
          </section>
          <div className={css.startEndTimeTitle}>
            Add a start & finish time for your remote work day pass*
          </div>
          <section className={css.time}>
            <div className={css.startEndTime}>
              <div>Start Time*</div>
              <Select
                id="startTime"
                name="startTime"
                options={timeOptions}
                onChange={changeStartTime}
                value={startTime}
                isSearchable={false}
                // menuIsOpen={true}
              />
            </div>
            <div className={css.startEndTime}>
              <div>End Time*</div>
              <Select
                id="endTime"
                name="endTime"
                options={endTimeOptions}
                onChange={changeEndTime}
                value={endTime}
                isSearchable={false}
              />
            </div>
          </section>
          <section className={css.entryRulesSection}>
            <div className={css.entryRulesTitle}>
              Optional: Add any rules for guests to follow during their remote work day pass
            </div>
            {rules.map(option => (
              <div>
                {' '}
                <label key={option.value} className={css.checkBoxLabel}>
                  <input
                    type="checkbox"
                    checked={rulesVal[option.value]}
                    onChange={() => handleRulesChange(option.value)}
                    className={css.checkBox}
                  />
                  <span className={css.label}> {option.label}</span>
                </label>
              </div>
            ))}
            {showOtherEntryRules && (
              // <textarea
              //   className={css.entryRulesInput}
              //   id="entryRules"
              //   name="entryRules"
              //   rows={4}
              //   cols={50}
              //   placeholder="Ex: No work phone calls/laptop calls permitted."
              //   value={entryRules}
              //   onChange={e => handleEntryRules(e)}
              // />
              <Suspense fallback={<div>Loading...</div>}>
                <div className={css.editor}>
                  <TextEditor
                    name="entryRules"
                    setEditorState={setEditorState}
                    editorState={editorState}
                  />
                </div>
              </Suspense>
            )}
          </section>
          <section className={css.electricRules}>
            <div className={css.entryRulesTitle}>
              Electrical outlet availability description for guests*
            </div>
            {electricalOutletOption.map(option => (
              <div>
                {' '}
                <label key={option.value} className={css.checkBoxLabel}>
                  <input
                    type="checkbox"
                    checked={checkBoxVal[option.value]}
                    onChange={() => handleCheckboxChange(option.value)}
                    className={css.checkBox}
                  />
                  <span className={css.label}> {option.label}</span>
                </label>
              </div>
            ))}
          </section>
        </>
      ) : null}

      {errors.showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
        </p>
      ) : null}

      {/* {!isPublished ? ( */}
      <Button
        className={css.goToNextTabButton}
        // onClick={onNextTab}
        onClick={() => {
          updateAndNextTab(id, slug, editListingLinkType);
        }}
        // disabled={!hasAvailabilityPlan}
        disabled={allValuesFalseRef}
      >
        {submitButtonText}
      </Button>
      {/* ) : null} */}

      {onManageDisableScrolling && isEditPlanModalOpen ? (
        <Modal
          className={css.availabilityModal}
          id="EditAvailabilityPlan"
          isOpen={isEditPlanModalOpen}
          onClose={() => setIsEditPlanModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <EditListingAvailabilityPlanForm
            formId="EditListingAvailabilityPlanForm"
            listingTitle={listingAttributes?.title}
            availabilityPlan={availabilityPlan}
            weekdays={rotateDays(WEEKDAYS, firstDayOfWeek)}
            useFullDays={useFullDays}
            onSubmit={handleSubmit}
            initialValues={
              listingAttributes?.availabilityPlan?.timezone
                ? {
                    ...initialValues,
                    timezone:
                      listingAttributes?.privateData?.timezone === 'America/Miami'
                        ? 'America/Miami'
                        : listingAttributes?.availabilityPlan?.timezone,
                  }
                : initialValues
            }
            listingAttributes={listingAttributes}
            inProgress={updateInProgress}
            fetchErrors={errors}
          />
        </Modal>
      ) : null}

      {onManageDisableScrolling && isEditExceptionsModalOpen ? (
        <Modal
          id="EditAvailabilityExceptions"
          isOpen={isEditExceptionsModalOpen}
          onClose={() => setIsEditExceptionsModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <EditListingAvailabilityExceptionForm
            formId="EditListingAvailabilityExceptionForm"
            listingId={listing.id}
            allExceptions={allExceptions}
            monthlyExceptionQueries={monthlyExceptionQueries}
            fetchErrors={errors}
            onFetchExceptions={onFetchExceptions}
            onSubmit={saveException}
            timeZone={availabilityPlan.timezone}
            isDaily={unitType === DAY}
            updateInProgress={updateInProgress}
            useFullDays={useFullDays}
          />
        </Modal>
      ) : null}
    </main>
  );
};

EditListingAvailabilityPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
  monthlyExceptionQueries: null,
  weeklyExceptionQueries: null,
  allExceptions: [],
};

EditListingAvailabilityPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  monthlyExceptionQueries: object,
  weeklyExceptionQueries: object,
  allExceptions: arrayOf(propTypes.availabilityException),
  onAddAvailabilityException: func.isRequired,
  onDeleteAvailabilityException: func.isRequired,
  onSubmit: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onNextTab: func.isRequired,
  submitButtonText: string.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingAvailabilityPanel;
