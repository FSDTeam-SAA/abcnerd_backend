import axios from "axios";
import config from "../config";

const TOSS_API_URL = "https://api.tosspayments.com/v1";

// Basic Auth header for Toss: base64(secretKey + ":")
const getAuthHeader = () => {
  const secretKey = config.toss.secretKey;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY is not defined");
  const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");
  return {
    Authorization: `Basic ${encodedKey}`,
    "Content-Type": "application/json",
  };
};

export const tossPayments = {
  /**
   * Issue a billing key using an authKey and customerKey.
   * This is used for subscriptions (recurring payments).
   */
  issueBillingKey: async (authKey: string, customerKey: string) => {
    const response = await axios.post(
      `${TOSS_API_URL}/billing/authorizations/issue`,
      { authKey, customerKey },
      { headers: getAuthHeader() }
    );
    return response.data; // contains billingKey
  },

  /**
   * Process a payment using a billingKey (recurring payment).
   */
  chargeBillingKey: async (payload: {
    billingKey: string;
    customerKey: string;
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail?: string;
  }) => {
    const { billingKey, ...data } = payload;
    const response = await axios.post(
      `${TOSS_API_URL}/billing/${billingKey}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Confirm a one-time payment (not typically used for billing keys but good to have).
   */
  confirmPayment: async (paymentKey: string, orderId: string, amount: number) => {
    const response = await axios.post(
      `${TOSS_API_URL}/payments/confirm`,
      { paymentKey, orderId, amount },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Fetch payment details by paymentKey.
   */
  getPayment: async (paymentKey: string) => {
    const response = await axios.get(
      `${TOSS_API_URL}/payments/${paymentKey}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};
