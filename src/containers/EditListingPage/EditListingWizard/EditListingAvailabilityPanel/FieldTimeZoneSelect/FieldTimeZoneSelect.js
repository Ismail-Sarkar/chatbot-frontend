import React from 'react';
import { string } from 'prop-types';
import { getTimeZoneNames } from '../../../../../util/dates';
import { FieldSelect } from '../../../../../components';

const FieldTimeZoneSelect = props => {
  const { listingAttributes = {}, formApi } = props;

  const timezone = false;
  // const { timezone } = listingAttributes.privateData || {};
  // restOfprops.listingAttributes?.privateData?.timezone === 'America/Miami'
  //                     ? // ? restOfprops.listingAttributes?.privateData?.timezone
  //                       'America/Miami'
  //                     :
  // IANA database contains irrelevant time zones too.
  const relevantZonesPattern = new RegExp(
    '^(Africa|America(?!/(Argentina/ComodRivadavia|Knox_IN|Nuuk))|Antarctica(?!/(DumontDUrville|McMurdo))|Asia(?!/Qostanay)|Atlantic|Australia(?!/(ACT|LHI|NSW))|Europe|Indian|Pacific)'
  );

  const auxTz = [...getTimeZoneNames(relevantZonesPattern)];

  auxTz.splice(
    auxTz.findIndex(({ value }) => value === 'America/New_York'),
    1,
    { label: 'America/Miami', value: 'America/Miami' }
  );

  const tzToDisplay = timezone ? auxTz : getTimeZoneNames(relevantZonesPattern);


  return (
    <FieldSelect {...props}>
      <option disabled value="">
        Pick something...
      </option>
      {getTimeZoneNames(relevantZonesPattern).map(tz => (
        // <option key={tz} value={tz}>
        <option key={tz.value} value={tz.label}>
          {tz.label}
        </option>
      ))}
    </FieldSelect>
  );
};

FieldTimeZoneSelect.defaultProps = {
  rootClassName: null,
  className: null,
  id: null,
  label: null,
};

FieldTimeZoneSelect.propTypes = {
  rootClassName: string,
  className: string,

  // Label is optional, but if it is given, an id is also required so
  // the label can reference the input in the `for` attribute
  id: string,
  label: string,
  name: string.isRequired,
};

export default FieldTimeZoneSelect;
