import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { apiBaseUrl } from '../../../util/api';

import css from './TransactionPanel.module.css';

function ProviderEmailMaybe(props) {
  const { provider, isCustomer } = props;
  const providerId = provider && provider.id && provider.id.uuid;
  const [providerEmail, setProviderEmail] = useState(null);
  useEffect(() => {
    providerId &&
      axios.get(`${apiBaseUrl()}/api/getProviderMail/${providerId}`).then(resp => {
        const { email } = resp?.data?.data || {};
        setProviderEmail(email);
        console.log(email);
      });
  }, [providerId]);

  return isCustomer && providerEmail ? (
    <div className={css.providerMailSection}>
      <a href={`mailto:${providerEmail}`}>{providerEmail}</a>
    </div>
  ) : null;
}

export default ProviderEmailMaybe;
