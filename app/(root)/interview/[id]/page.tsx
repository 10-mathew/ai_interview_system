import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  // Dummy user
  const dummyUser = {
    id: "demo-user",
    name: "Demo User",
    email: "demo@example.com",
  };

  // Dummy interview data
  const dummyInterview = {
    id,
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js"],
    questions: [
      "What is React?",
      "Explain how hooks work",
      "Describe the virtual DOM",
    ],
    finalized: true,
  };

  if (!dummyInterview) redirect("/");

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize">{dummyInterview.role} Interview</h3>
          </div>

          <DisplayTechIcons techStack={dummyInterview.techstack} />
        </div>

        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
          {dummyInterview.type}
        </p>
      </div>

      <Agent
        userName={dummyUser.name}
        userId={dummyUser.id}
        interviewId={id}
        type="interview"
        questions={dummyInterview.questions}
      />
    </>
  );
};

export default InterviewDetails;
