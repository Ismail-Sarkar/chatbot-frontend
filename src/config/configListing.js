/////////////////////////////////////////////////////////
// Configurations related to listing.                  //
// Main configuration here is the extended data config //
/////////////////////////////////////////////////////////

// NOTE: if you want to change the structure of the data,
// you should also check src/util/configHelpers.js
// some validation is added there.

/**
 * Configuration options for listing fields (custom extended data fields):
 * - key:                           Unique key for the extended data field.
 * - scope (optional):              Scope of the extended data can be either 'public' or 'private'.
 *                                  Default value: 'public'.
 *                                  Note: listing doesn't support 'protected' scope atm.
 * - includeForListingTypes:        An array of listing types, for which the extended
 *   (optional)                     data is relevant and should be added.
 * - schemaType (optional):         Schema for this extended data field.
 *                                  This is relevant when rendering components and querying listings.
 *                                  Possible values: 'enum', 'multi-enum', 'text', 'long', 'boolean'.
 * - enumOptions (optional):        Options shown for 'enum' and 'multi-enum' extended data.
 *                                  These are used to render options for inputs and filters on
 *                                  EditListingPage, ListingPage, and SearchPage.
 * - filterConfig:                  Filter configuration for listings query.
 *    - indexForSearch (optional):    If set as true, it is assumed that the extended data key has
 *                                    search index in place. I.e. the key can be used to filter
 *                                    listing queries (then scope needs to be 'public').
 *                                    Note: Flex CLI can be used to set search index for the key:
 *                                    https://www.sharetribe.com/docs/references/extended-data/#search-schema
 *                                    Read more about filtering listings with public data keys from API Reference:
 *                                    https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
 *                                    Default value: false,
 *   - filterType:                    Sometimes a single schemaType can be rendered with different filter components.
 *                                    For 'enum' schema, filterType can be 'SelectSingleFilter' or 'SelectMultipleFilter'
 *   - label:                         Label for the filter, if the field can be used as query filter
 *   - searchMode (optional):         Search mode for indexed data with multi-enum schema.
 *                                    Possible values: 'has_all' or 'has_any'.
 *   - group:                         SearchPageWithMap has grouped filters. Possible values: 'primary' or 'secondary'.
 * - showConfig:                    Configuration for rendering listing. (How the field should be shown.)
 *   - label:                         Label for the saved data.
 *   - isDetail                       Can be used to hide detail row (of type enum, boolean, or long) from listing page.
 *                                    Default value: true,
 * - saveConfig:                    Configuration for adding and modifying extended data fields.
 *   - label:                         Label for the input field.
 *   - placeholderMessage (optional): Default message for user input.
 *   - isRequired (optional):         Is the field required for providers to fill
 *   - requiredMessage (optional):    Message for those fields, which are mandatory.
 */
export const listingFields = [
  {
    key: 'category',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'city-bikes', label: 'City bikes' },
      { option: 'electric-bikes', label: 'Electric bikes' },
      { option: 'mountain-bikes', label: 'Mountain bikes' },
      { option: 'childrens-bikes', label: "Children's bikes" },
    ],
    filterConfig: {
      indexForSearch: true,
      filterType: 'SelectMultipleFilter',
      label: 'Category',
      group: 'primary',
    },
    showConfig: {
      label: 'Category',
      isDetail: true,
    },
    saveConfig: {
      label: 'Category',
      placeholderMessage: 'Select an option…',
      isRequired: true,
      requiredMessage: 'You need to select a category.',
    },
  },
  {
    key: 'tire',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: '29', label: '29' },
      { option: '28', label: '28' },
      { option: '27', label: '27' },
      { option: '26', label: '26' },
      { option: '24', label: '24' },
      { option: '20', label: '20' },
      { option: '18', label: '18' },
    ],
    filterConfig: {
      indexForSearch: true,
      label: 'Tire size',
      group: 'secondary',
    },
    showConfig: {
      label: 'Tire size',
      isDetail: true,
    },
    saveConfig: {
      label: 'Tire size',
      placeholderMessage: 'Select an option…',
      isRequired: true,
      requiredMessage: 'You need to select a tire size.',
    },
  },
  {
    key: 'brand',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'cube', label: 'Cube' },
      { option: 'diamant', label: 'Diamant' },
      { option: 'ghost', label: 'GHOST' },
      { option: 'giant', label: 'Giant' },
      { option: 'kalkhoff', label: 'Kalkhoff' },
      { option: 'kona', label: 'Kona' },
      { option: 'otler', label: 'Otler' },
      { option: 'vermont', label: 'Vermont' },
    ],
    filterConfig: {
      indexForSearch: true,
      label: 'Brand',
      group: 'secondary',
    },
    showConfig: {
      label: 'Brand',
      isDetail: true,
    },
    saveConfig: {
      label: 'Brand',
      placeholderMessage: 'Select an option…',
      isRequired: true,
      requiredMessage: 'You need to select a brand.',
    },
  },
  {
    key: 'accessories',
    scope: 'public',
    schemaType: 'multi-enum',
    enumOptions: [
      { option: 'bell', label: 'Bell' },
      { option: 'lights', label: 'Lights' },
      { option: 'lock', label: 'Lock' },
      { option: 'mudguard', label: 'Mudguard' },
    ],
    filterConfig: {
      indexForSearch: true,
      label: 'Accessories',
      searchMode: 'has_all',
      group: 'secondary',
    },
    showConfig: {
      label: 'Accessories',
    },
    saveConfig: {
      label: 'Accessories',
      placeholderMessage: 'Select an option…',
      isRequired: false,
    },
  },

  // // An example of how to use transaction type specific custom fields and private data.
  // {
  //   key: 'note',
  //   scope: 'public',
  //   includeForListingTypes: ['product-selling'],
  //   schemaType: 'text',
  //   showConfig: {
  //     label: 'Extra notes',
  //   },
  //   saveConfig: {
  //     label: 'Extra notes',
  //     placeholderMessage: 'Some public extra note about this bike...',
  //   },
  // },
  // {
  //   key: 'privatenote',
  //   scope: 'private',
  //   includeForListingTypes: ['daily-booking'],
  //   schemaType: 'text',
  //   saveConfig: {
  //     label: 'Private notes',
  //     placeholderMessage: 'Some private note about this bike...',
  //   },
  // },
];

///////////////////////////////////////////////////////////////////////
// Configurations related to listing types and transaction processes //
///////////////////////////////////////////////////////////////////////

// A presets of supported listing configurations
//
// Note 1: With first iteration of hosted configs, we are unlikely to support
//         multiple listing types, even though this template has some
//         rudimentary support for it.
// Note 2: transaction type is part of listing type. It defines what transaction process and units
//         are used when transaction is created against a specific listing.

/**
 * Configuration options for listing experience:
 * - listingType:         Unique string. This will be saved to listing's public data on
 *                        EditListingWizard.
 * - label                Label for the listing type. Used as microcopy for options to select
 *                        listing type in EditListingWizard.
 * - transactionType      Set of configurations how this listing type will behave when transaction is
 *                        created.
 *   - process              Transaction process.
 *                          The process must match one of the processes that this client app can handle
 *                          (check src/util/transactions/transaction.js) and the process must also exists in correct
 *                          marketplace environment.
 *   - alias                Valid alias for the aforementioned process. This will be saved to listing's
 *                          public data as transctionProcessAlias and transaction is initiated with this.
 *   - unitType             Unit type is mainly used as pricing unit. This will be saved to
 *                          transaction's protected data.
 *                          Recommendation: don't use same unit types in completely different processes
 *                          ('item' sold should not be priced the same as 'item' booked).
 * - stockType            This is relevant only to listings using default-purchase process.
 *                        If set to 'oneItem', stock management is not showed and the listing is
 *                        considered unique (stock = 1).
 *                        Possible values: 'oneItem' and 'multipleItems'.
 *                        Default: 'multipleItems'.
 * - defaultListingFields This is relevant only to listings using default-inquiry process atm.
 *                        It contains price: true/false value to indicate, whether price should be shown.
 *                        If defaultListingFields.price is not explicitly set to _false_, price will be shown.
 */

export const listingTypes = [
  {
    listingType: 'adventurely-booking',
    label: 'Adventurely-booking',
    transactionType: {
      process: 'adventurely-booking',
      alias: 'adventurely-booking/release-1',
      unitType: 'day',
    },
  },
  // // Here are some examples for other listingTypes
  // // TODO: SearchPage does not work well if both booking and product selling are used at the same time
  // {
  //   listingType: 'nightly-booking',
  //   label: 'Nightly booking',
  //   transactionType: {
  //     process: 'default-booking',
  //     alias: 'default-booking/release-1',
  //     unitType: 'night',
  //   },
  // },
  // {
  //   listingType: 'hourly-booking',
  //   label: 'Hourly booking',
  //   transactionType: {
  //     process: 'default-booking',
  //     alias: 'default-booking/release-1',
  //     unitType: 'hour',
  //   },
  // },
  // {
  //   listingType: 'product-selling',
  //   label: 'Sell bicycles',
  //   transactionType: {
  //     process: 'default-purchase',
  //     alias: 'default-purchase/release-1',
  //     unitType: 'item',
  //   },
  //   stockType: 'multipleItems',
  // },
  // {
  //   listingType: 'inquiry',
  //   label: 'Inquiry',
  //   transactionType: {
  //     process: 'default-inquiry',
  //     alias: 'default-inquiry/release-1',
  //     unitType: 'inquiry',
  //   },
  //   defaultListingFields: {
  //     price: false,
  //   },
  // },
];

// SearchPage can enforce listing query to only those listings with valid listingType
// However, it only works if you have set 'enum' type search schema for the public data fields
//   - listingType
//
//  Similar setup could be expanded to 2 other extended data fields:
//   - transactionProcessAlias
//   - unitType
//
// Read More:
// https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
export const enforceValidListingType = false;

export const availablePaymentMethods = [
  {
    key: 'creditDebitCash',
    label: 'Credit/debit card and cash',
    value: 'creditDebitCash',
    option: 'creditDebitCash',
  },
  {
    key: 'creditDebit',
    label: 'Credit/debit card only',
    value: 'creditDebit',
    option: 'creditDebit',
  },
  { key: 'cash', label: 'Cash only', value: 'cash', option: 'cash' },
];
export const electricalOutletOption = [
  {
    key: 'noOutletsAvailable',
    label: 'No outlets available - arrive with your laptop/phone charged',
    value: 'noOutletsAvailable',
    option: 'noOutletsAvailable',
  },
  {
    key: 'smallAmountOfOutletAvailable',
    label: 'A small amount of outlets available - arrive with your laptop/phone charged',
    value: 'smallAmountOfOutletAvailable',
    option: 'smallAmountOfOutletAvailable',
  },
  {
    key: 'severalOutletsAvailable',
    label: 'Several outlets are available - arrive with your laptop/phone charge',
    value: 'severalOutletsAvailable',
    option: 'severalOutletsAvailable',
  },
];
export const rules = [
  {
    key: 'noPhoneLaptopWorkCalls',
    label: 'No phone or laptop work calls permitted while using your pass',
    value: 'noPhoneLaptopWorkCalls',
    option: 'noPhoneLaptopWorkCalls',
  },
  {
    key: 'headphoneMust',
    label:
      'Headphones must be used for streaming music/audio from your phone or laptop while using your pass',
    value: 'headphoneMust',
    option: 'headphoneMust',
  },
  {
    key: 'other',
    label: 'Other',
    value: 'other',
    option: 'other',
  },
];

export const currencyList = [
  {
    key: 'AED',
    value: 'AED د.إ',
  },
  {
    key: 'AFN',
    value: 'AFN ؋',
  },
  {
    key: 'ALL',
    value: 'ALL L',
  },
  {
    key: 'AMD',
    value: 'AMD ֏',
  },
  {
    key: 'ANG',
    value: 'ANG ƒ',
  },
  {
    key: 'AOA',
    value: 'AOA Kz',
  },
  {
    key: 'ARS',
    value: 'ARS $',
  },
  {
    key: 'AUD',
    value: 'AUD $',
  },
  {
    key: 'AWG',
    value: 'AWG ƒ',
  },
  {
    key: 'AZN',
    value: 'AZN ₼',
  },
  {
    key: 'BAM',
    value: 'BAM KM',
  },
  {
    key: 'BBD',
    value: 'BBD $',
  },
  {
    key: 'BDT',
    value: 'BDT ৳',
  },
  {
    key: 'BGN',
    value: 'BGN лв',
  },
  {
    key: 'BHD',
    value: 'BHD .د.ب',
  },
  {
    key: 'BIF',
    value: 'BIF FBu',
  },
  {
    key: 'BMD',
    value: 'BMD $',
  },
  {
    key: 'BND',
    value: 'BND $',
  },
  {
    key: 'BOB',
    value: 'BOB Bs.',
  },
  {
    key: 'BRL',
    value: 'BRL R$',
  },
  {
    key: 'BSD',
    value: 'BSD $',
  },
  {
    key: 'BTC',
    value: 'BTC ₿',
  },
  {
    key: 'BTN',
    value: 'BTN Nu.',
  },
  {
    key: 'BWP',
    value: 'BWP P',
  },
  {
    key: 'BYN',
    value: 'BYN Br',
  },
  {
    key: 'BYR',
    value: 'BYR Br',
  },
  {
    key: 'BZD',
    value: 'BZD BZ$',
  },
  {
    key: 'CAD',
    value: 'CAD $',
  },
  {
    key: 'CDF',
    value: 'CDF FC',
  },
  {
    key: 'CHF',
    value: 'CHF CHF',
  },
  {
    key: 'CLF',
    value: 'CLF UF',
  },
  {
    key: 'CLP',
    value: 'CLP $',
  },
  {
    key: 'CNY',
    value: 'CNY ¥',
  },
  {
    key: 'COP',
    value: 'COP $',
  },
  {
    key: 'CRC',
    value: 'CRC ₡',
  },
  {
    key: 'CUC',
    value: 'CUC $',
  },
  {
    key: 'CUP',
    value: 'CUP ₱',
  },
  {
    key: 'CVE',
    value: 'CVE $',
  },
  {
    key: 'CZK',
    value: 'CZK Kč',
  },
  {
    key: 'DJF',
    value: 'DJF Fdj',
  },
  {
    key: 'DKK',
    value: 'DKK kr',
  },
  {
    key: 'DOP',
    value: 'DOP RD$',
  },
  {
    key: 'DZD',
    value: 'DZD دج',
  },
  {
    key: 'EGP',
    value: 'EGP £',
  },
  {
    key: 'ERN',
    value: 'ERN Nfk',
  },
  {
    key: 'ETB',
    value: 'ETB Br',
  },
  {
    key: 'EUR',
    value: 'EUR €',
  },
  {
    key: 'FJD',
    value: 'FJD $',
  },
  {
    key: 'FKP',
    value: 'FKP £',
  },
  {
    key: 'GBP',
    value: 'GBP £',
  },
  {
    key: 'GEL',
    value: 'GEL ₾',
  },
  {
    key: 'GGP',
    value: 'GGP £',
  },
  {
    key: 'GHS',
    value: 'GHS ₵',
  },
  {
    key: 'GIP',
    value: 'GIP £',
  },
  {
    key: 'GMD',
    value: 'GMD D',
  },
  {
    key: 'GNF',
    value: 'GNF FG',
  },
  {
    key: 'GTQ',
    value: 'GTQ Q',
  },
  {
    key: 'GYD',
    value: 'GYD $',
  },
  {
    key: 'HKD',
    value: 'HKD $',
  },
  {
    key: 'HNL',
    value: 'HNL L',
  },
  {
    key: 'HRK',
    value: 'HRK kn',
  },
  {
    key: 'HTG',
    value: 'HTG G',
  },
  {
    key: 'HUF',
    value: 'HUF Ft',
  },
  {
    key: 'IDR',
    value: 'IDR Rp',
  },
  {
    key: 'ILS',
    value: 'ILS ₪',
  },
  {
    key: 'IMP',
    value: 'IMP £',
  },
  {
    key: 'INR',
    value: 'INR ₹',
  },
  {
    key: 'IQD',
    value: 'IQD ع.د',
  },
  {
    key: 'IRR',
    value: 'IRR ﷼',
  },
  {
    key: 'ISK',
    value: 'ISK kr',
  },
  {
    key: 'JEP',
    value: 'JEP £',
  },
  {
    key: 'JMD',
    value: 'JMD $',
  },
  {
    key: 'JOD',
    value: 'JOD د.ا',
  },
  {
    key: 'JPY',
    value: 'JPY ¥',
  },
  {
    key: 'KES',
    value: 'KES KSh',
  },
  {
    key: 'KGS',
    value: 'KGS сом',
  },
  {
    key: 'KHR',
    value: 'KHR ៛',
  },
  {
    key: 'KMF',
    value: 'KMF CF',
  },
  {
    key: 'KPW',
    value: 'KPW ₩',
  },
  {
    key: 'KRW',
    value: 'KRW ₩',
  },
  {
    key: 'KWD',
    value: 'KWD د.ك',
  },
  {
    key: 'KYD',
    value: 'KYD $',
  },
  {
    key: 'KZT',
    value: 'KZT ₸',
  },
  {
    key: 'LAK',
    value: 'LAK ₭',
  },
  {
    key: 'LBP',
    value: 'LBP £',
  },
  {
    key: 'LKR',
    value: 'LKR Rs',
  },
  {
    key: 'LRD',
    value: 'LRD $',
  },
  {
    key: 'LSL',
    value: 'LSL L',
  },
  {
    key: 'LTL',
    value: 'LTL Lt',
  },
  {
    key: 'LVL',
    value: 'LVL Ls',
  },
  {
    key: 'LYD',
    value: 'LYD ل.د',
  },
  {
    key: 'MAD',
    value: 'MAD د.م.',
  },
  {
    key: 'MDL',
    value: 'MDL lei',
  },
  {
    key: 'MGA',
    value: 'MGA Ar',
  },
  {
    key: 'MKD',
    value: 'MKD ден',
  },
  {
    key: 'MMK',
    value: 'MMK Ks',
  },
  {
    key: 'MNT',
    value: 'MNT ₮',
  },
  {
    key: 'MOP',
    value: 'MOP MOP$',
  },
  {
    key: 'MRO',
    value: 'MRO UM',
  },
  {
    key: 'MUR',
    value: 'MUR ₨',
  },
  {
    key: 'MVR',
    value: 'MVR Rf',
  },
  {
    key: 'MWK',
    value: 'MWK MK',
  },
  {
    key: 'MXN',
    value: 'MXN $',
  },
  {
    key: 'MYR',
    value: 'MYR RM',
  },
  {
    key: 'MZN',
    value: 'MZN MT',
  },
  {
    key: 'NAD',
    value: 'NAD $',
  },
  {
    key: 'NGN',
    value: 'NGN ₦',
  },
  {
    key: 'NIO',
    value: 'NIO C$',
  },
  {
    key: 'NOK',
    value: 'NOK kr',
  },
  {
    key: 'NPR',
    value: 'NPR ₨',
  },
  {
    key: 'NZD',
    value: 'NZD $',
  },
  {
    key: 'OMR',
    value: 'OMR ﷼',
  },
  {
    key: 'PAB',
    value: 'PAB B/.',
  },
  {
    key: 'PEN',
    value: 'PEN S/.',
  },
  {
    key: 'PGK',
    value: 'PGK K',
  },
  {
    key: 'PHP',
    value: 'PHP ₱',
  },
  {
    key: 'PKR',
    value: 'PKR ₨',
  },
  {
    key: 'PLN',
    value: 'PLN zł',
  },
  {
    key: 'PYG',
    value: 'PYG ₲',
  },
  {
    key: 'QAR',
    value: 'QAR ر.ق',
  },
  {
    key: 'RON',
    value: 'RON lei',
  },
  {
    key: 'RSD',
    value: 'RSD Дин.',
  },
  {
    key: 'RUB',
    value: 'RUB ₽',
  },
  {
    key: 'RWF',
    value: 'RWF RF',
  },
  {
    key: 'SAR',
    value: 'SAR ﷼',
  },
  {
    key: 'SBD',
    value: 'SBD $',
  },
  {
    key: 'SCR',
    value: 'SCR ₨',
  },
  {
    key: 'SDG',
    value: 'SDG £',
  },
  {
    key: 'SEK',
    value: 'SEK kr',
  },
  {
    key: 'SGD',
    value: 'SGD $',
  },
  {
    key: 'SHP',
    value: 'SHP £',
  },
  {
    key: 'SLE',
    value: 'SLE Le',
  },
  {
    key: 'SLL',
    value: 'SLL Le',
  },
  {
    key: 'SOS',
    value: 'SOS S',
  },
  {
    key: 'SRD',
    value: 'SRD $',
  },
  {
    key: 'STD',
    value: 'STD Db',
  },
  {
    key: 'SYP',
    value: 'SYP £',
  },
  {
    key: 'SZL',
    value: 'SZL L',
  },
  {
    key: 'THB',
    value: 'THB ฿',
  },
  {
    key: 'TJS',
    value: 'TJS ЅМ',
  },
  {
    key: 'TMT',
    value: 'TMT T',
  },
  {
    key: 'TND',
    value: 'TND د.ت',
  },
  {
    key: 'TOP',
    value: 'TOP T$',
  },
  {
    key: 'TRY',
    value: 'TRY ₺',
  },
  {
    key: 'TTD',
    value: 'TTD TT$',
  },
  {
    key: 'TWD',
    value: 'TWD NT$',
  },
  {
    key: 'TZS',
    value: 'TZS TSh',
  },
  {
    key: 'UAH',
    value: 'UAH ₴',
  },
  {
    key: 'UGX',
    value: 'UGX UGX',
  },
  // {
  //   key: 'USD',
  //   value: 'USD $',
  // },
  {
    key: 'UYU',
    value: 'UYU $U',
  },
  {
    key: 'UZS',
    value: 'UZS soʻm',
  },
  {
    key: 'VEF',
    value: 'VEF Bs F',
  },
  {
    key: 'VES',
    value: 'VES Bs.S',
  },
  {
    key: 'VND',
    value: 'VND ₫',
  },
  {
    key: 'VUV',
    value: 'VUV Vt',
  },
  {
    key: 'WST',
    value: 'WST WS$',
  },
  {
    key: 'XAF',
    value: 'XAF FCFA',
  },
  {
    key: 'XAG',
    value: 'XAG oz',
  },
  {
    key: 'XAU',
    value: 'XAU oz',
  },
  {
    key: 'XCD',
    value: 'XCD $',
  },
  {
    key: 'XDR',
    value: 'XDR SDR',
  },
  {
    key: 'XOF',
    value: 'XOF CFA',
  },
  {
    key: 'XPF',
    value: 'XPF ₣',
  },
  {
    key: 'YER',
    value: 'YER ﷼',
  },
  {
    key: 'ZAR',
    value: 'ZAR R',
  },
  {
    key: 'ZMK',
    value: 'ZMK ZK',
  },
  {
    key: 'ZMW',
    value: 'ZMW ZK',
  },
  {
    key: 'ZWL',
    value: 'ZWL $',
  },
];
