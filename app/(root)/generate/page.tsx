import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const GeneratePage = () => {
  const router = useRouter();
  const [generatedLink, setGeneratedLink] = useState<string>("");

  const handleGenerateLink = () => {
    const interviewId = uuidv4();
    const link = `${window.location.origin}/interview/${interviewId}`;
    setGeneratedLink(link);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8">Generate Interview Link</h1>
      
      {!generatedLink ? (
        <button
          onClick={handleGenerateLink}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Generate New Interview Link
        </button>
      ) : (
        <div className="text-center">
          <p className="mb-4">Your interview link is ready!</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="text-sm">{generatedLink}</code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(generatedLink)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors mr-2"
          >
            Copy Link
          </button>
          <button
            onClick={() => router.push(generatedLink)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Go to Interview
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneratePage; 