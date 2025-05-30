"use server";

import { db } from "@/firebase/admin";

interface InterviewData {
  userName: string;
  position: string;
  positionDescription?: string | null;
  cvContent?: string | null;
  createdAt: string;
}

export async function saveInterviewData(params: {
  interviewId: string;
  userName: string;
  position: string;
  positionDescription?: string;
  cvContent?: string;
}) {
  const { interviewId, userName, position, positionDescription, cvContent } = params;

  if (!db) {
    console.warn("Firebase database not initialized");
    return { success: false };
  }

  try {
    const interviewData: InterviewData = {
      userName,
      position,
      positionDescription: positionDescription || null,
      cvContent: cvContent || null,
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviewData").doc(interviewId).set(interviewData);
    return { success: true };
  } catch (error) {
    console.error("Error saving interview data:", error);
    return { success: false };
  }
}

export async function getInterviewData(interviewId: string): Promise<InterviewData | null> {
  if (!db) {
    console.warn("Firebase database not initialized");
    return null;
  }

  try {
    const doc = await db.collection("interviewData").doc(interviewId).get();
    return doc.exists ? (doc.data() as InterviewData) : null;
  } catch (error) {
    console.error("Error fetching interview data:", error);
    return null;
  }
} 