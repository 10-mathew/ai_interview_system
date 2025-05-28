import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, userName, userId, interviewId, position, cvContent } = body;

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
            model: "claude-3-opus-20240229",
            messages: [
              {
                role: "system",
                content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Candidate Information:
- Name: ${userName}
- Position: ${position}

${cvContent ? `CANDIDATE'S CV
==================
${cvContent}
==================

Please use this CV/resume information to:
1. Ask relevant questions about their experience and skills
2. Probe deeper into specific projects or achievements mentioned
3. Assess how their background aligns with the ${position} position
4. Identify areas where they might need to elaborate or provide more detail

Remember to:
- Start by acknowledging their name and the position they're interviewing for
- Reference specific details from their CV when asking questions
- Keep the conversation natural and flowing
- Listen actively to responses and ask relevant follow-up questions
- Be thorough in your assessment while maintaining a professional and friendly tone

` : ''}

Interview Guidelines:
- Be professional and polite
- Keep responses concise and conversational
- Ask follow-up questions when needed
- Focus on both technical skills and soft skills
- End the interview professionally with next steps

Remember to:
- Listen actively to responses
- Acknowledge answers before moving forward
- Keep the conversation flowing naturally
- Be thorough in your assessment`
              }
            ]
          }
        },
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        metadata: {
          userId,
          interviewId,
          userName,
          position,
          hasCV: !!cvContent
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