import axios from 'axios';
import { getConfig } from './config.js';

function getBaseURL() {
  const configuredUrl = getConfig('baseUrl');
  return configuredUrl || 'https://api.klarna.com';
}

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  const apiKey = getConfig('apiKey');
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
}

async function request(endpoint, method = 'GET', data = null) {
  const baseURL = getBaseURL();
  try {
    const config = {
      method,
      url: `${baseURL}${endpoint}`,
      headers: getHeaders()
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(`API Error: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================
// API Methods
// ============================================================

/**
 * Cancel an existing authorization
 */
export async function cancelAuthorization(params = {}) {
  const endpoint = '/payments/v1/authorizations/{authorizationToken}';
  return await request(endpoint, 'DELETE', params);
}

/**
 * Generate a consumer token
 */
export async function purchaseToken(params = {}) {
  const endpoint = '/payments/v1/authorizations/{authorizationToken}/customer-token';
  return await request(endpoint, 'POST', params);
}

/**
 * Create a new order
 */
export async function createOrder(params = {}) {
  const endpoint = '/payments/v1/authorizations/{authorizationToken}/order';
  return await request(endpoint, 'POST', params);
}

/**
 * Create a new payment session
 */
export async function createCreditSession(params = {}) {
  const endpoint = '/payments/v1/sessions';
  return await request(endpoint, 'POST', params);
}

/**
 * Read an existing payment session
 */
export async function readCreditSession(params = {}) {
  const endpoint = '/payments/v1/sessions/{session_id}';
  return await request(endpoint, 'GET', params);
}

/**
 * Update an existing payment session
 */
export async function updateCreditSession(params = {}) {
  const endpoint = '/payments/v1/sessions/{session_id}';
  return await request(endpoint, 'POST', params);
}

