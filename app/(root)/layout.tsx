import Link from "next/link";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="root-layout">
      <nav className="flex justify-center">
        <Link href="/" className="flex items-center">
          <h2 className="text-primary-100 text-2xl font-bold">RecruitSense</h2>
        </Link>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
