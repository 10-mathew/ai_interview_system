import Agent from "@/components/Agent";

const Page = () => {
  // Dummy user data
  const dummyUser = {
    id: "demo-user",
    name: "Demo User",
    email: "demo@example.com",
  };

  return (
    <>
      <h3>Interview generation</h3>

      <Agent userName={dummyUser.name} userId={dummyUser.id} type="generate" />
    </>
  );
};

export default Page;
