import axios from 'axios';
import { getConfig } from './config.js';

const REGIONS = {
  eu: 'https://api.klarna.com',
  na: 'https://api-na.klarna.com',
  oc: 'https://api-oc.klarna.com'
};

function getBaseUrl() {
  const region = getConfig('region') || 'eu';
  return REGIONS[region] || REGIONS.eu;
}

/**
 * Make an authenticated API request
 */
async function apiRequest(method, endpoint, data = null, params = null) {
  const username = getConfig('username');
  const password = getConfig('password');

  if (!username || !password) {
    throw new Error('Credentials not configured. Run: klarnacompayments config set --username <user> --password <pass>');
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  const config = {
    method,
    url: `${getBaseUrl()}${endpoint}`,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (params) config.params = params;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      throw new Error('Authentication failed. Check your credentials.');
    } else if (status === 403) {
      throw new Error('Access forbidden. Check your API permissions.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    } else {
      const message = data?.error_message || data?.message || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from Klarna API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// SESSIONS
// ============================================================

export async function createSession({
  purchase_country = 'US',
  purchase_currency = 'USD',
  locale = 'en-US',
  order_amount,
  order_lines
} = {}) {
  const body = {
    purchase_country,
    purchase_currency,
    locale,
    order_amount,
    order_lines
  };

  const data = await apiRequest('POST', '/payments/v1/sessions', body);
  return data;
}

export async function getSession(sessionId) {
  const data = await apiRequest('GET', `/payments/v1/sessions/${sessionId}`);
  return data;
}

export async function updateSession(sessionId, { order_amount, order_lines } = {}) {
  const body = {
    order_amount,
    order_lines
  };

  const data = await apiRequest('POST', `/payments/v1/sessions/${sessionId}`, body);
  return data;
}

// ============================================================
// AUTHORIZATIONS
// ============================================================

export async function createAuthorization(authToken, {
  purchase_country = 'US',
  purchase_currency = 'USD',
  locale = 'en-US',
  order_amount,
  order_lines
} = {}) {
  const body = {
    purchase_country,
    purchase_currency,
    locale,
    order_amount,
    order_lines,
    auto_capture: false
  };

  const data = await apiRequest('POST', `/payments/v1/authorizations/${authToken}`, body);
  return data;
}

export async function getAuthorization(authToken) {
  const data = await apiRequest('GET', `/ordermanagement/v1/orders/${authToken}`);
  return data;
}

export async function cancelAuthorization(authToken) {
  const data = await apiRequest('POST', `/ordermanagement/v1/orders/${authToken}/cancel`);
  return data;
}

// ============================================================
// ORDERS
// ============================================================

export async function captureOrder(orderId, { captured_amount, description } = {}) {
  const body = {
    captured_amount,
    description
  };

  const data = await apiRequest('POST', `/ordermanagement/v1/orders/${orderId}/captures`, body);
  return data;
}

export async function getOrder(orderId) {
  const data = await apiRequest('GET', `/ordermanagement/v1/orders/${orderId}`);
  return data;
}

export async function updateOrderLines(orderId, { order_amount, order_lines } = {}) {
  const body = {
    order_amount,
    order_lines
  };

  const data = await apiRequest('PATCH', `/ordermanagement/v1/orders/${orderId}/authorization`, body);
  return data;
}

// ============================================================
// REFUNDS
// ============================================================

export async function createRefund(orderId, { refunded_amount, description } = {}) {
  const body = {
    refunded_amount,
    description
  };

  const data = await apiRequest('POST', `/ordermanagement/v1/orders/${orderId}/refunds`, body);
  return data;
}

export async function getCaptures(orderId) {
  const data = await apiRequest('GET', `/ordermanagement/v1/orders/${orderId}/captures`);
  return data;
}

export async function getRefunds(orderId) {
  const data = await apiRequest('GET', `/ordermanagement/v1/orders/${orderId}`);
  return data.refunds || [];
}
