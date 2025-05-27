import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, userName, userId, interviewId, position } = body;

    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        customer: {
          number: phoneNumber,
          name: userName
        },
        assistant: {
          name: "Interview Assistant",
          firstMessage: `Hello ${userName}! I'm your AI interviewer for the ${position} position. Are you ready to begin the interview?`,
          voice: {
            provider: "azure",
            voiceId: "andrew"
          },
          model: {
            provider: "anthropic",
            model: "claude-3-opus-20240229"
          }
        },
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        metadata: {
          userId,
          interviewId,
          userName,
          position
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to initiate call with Vapi');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    );
  }
} 