import Link from "next/link";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="root-layout">
      <nav className="flex justify-center">
        <Link href="/" className="flex items-center">
        </Link>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
