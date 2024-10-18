"use client"
import axios from "axios";
import { useState } from "react";
import base64 from "base-64";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_URL = import.meta.env.VITE_TOKEN_URL
const CONSUMER_KEY = import.meta.env.VITE_CONSUMER_KEY
const CONSUMER_SECRET = import.meta.env.VITE_CONSUMER_SECRET
const BUSINESS_PAYBILL = import.meta.env.VITE_BUSINESS_PAYBILL
const PASSKEY = import.meta.env.VITE_PASSKEY
const CALLBACK_ENDPOINT = import.meta.env.VITE_CALLBACK_ENDPOINT


export default function App(){

  console.log(API_URL, TOKEN_URL, CONSUMER_KEY, CONSUMER_SECRET);

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const getAccessToken = async () => {
    const credentials = base64.encode(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    try {
      const response = await axios.get(`${TOKEN_URL}`, {
        headers: {
          "Authorization": `Basic ${credentials}`,
        },
      });
      const { access_token } = response.data;
      return access_token;
    } catch (error) {
      console.error('Error fetching access token', error);
      throw error;
    }
  }

  const mpesaExpress = async () => {
    setLoading(true);
    const timestamp = format(new Date(), "yyyyMMddHHmmss");
    const password = base64.encode(`${BUSINESS_PAYBILL}${PASSKEY}${timestamp}`);

    try {
      const accessToken = await getAccessToken();
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const data = {
        BusinessShortCode: BUSINESS_PAYBILL,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        PartyA: phone,
        PartyB: BUSINESS_PAYBILL,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_ENDPOINT,
        AccountReference: "TestPay",
        TransactionDesc: "HelloTest",
        Amount: amount,
      };

      const response = await axios.post(
        `${API_URL}`,
        data,
        { headers }
      );

      setResponseMessage(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Error during M-PESA request:", error);
      setResponseMessage("An error occurred during the payment request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !amount) {
      setResponseMessage("Please fill in all fields.");
      return;
    }
    await mpesaExpress();
  };

  return (
    <div className="p-8">
      <h1>M-PESA Express Payment</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label>
          Phone Number:
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            required
          />
        </label>
        <label>
          Amount:
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>

      {responseMessage && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Response:</h3>
          <pre>{responseMessage}</pre>
        </div>
      )}
    </div>
  )
}