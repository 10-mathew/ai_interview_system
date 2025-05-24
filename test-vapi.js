import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Debug: Print environment variables (masking the API key)
console.log('Environment variables loaded:');
console.log('VAPI_API_KEY:', process.env.VAPI_API_KEY ? '***' + process.env.VAPI_API_KEY.slice(-4) : 'not set');
console.log('VAPI_WORKFLOW_ID:', process.env.VAPI_WORKFLOW_ID || 'not set');
console.log('VAPI_PHONE_NUMBER_ID:', process.env.VAPI_PHONE_NUMBER_ID || 'not set');

async function testVapiCall() {
  try {
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        customer: {
          number: '+919188056250',
          name: 'Test Customer'
        },
        assistant: {
          name: "Interview Assistant",
          firstMessage: "Hello! I'm your AI interviewer. Are you ready to begin the interview?",
          voice: {
            provider: "azure",
            voiceId: "andrew"
          },
          model: {
            provider: "anthropic",
            model: "claude-3-opus-20240229"
          }
        },
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID
      })
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testVapiCall(); 