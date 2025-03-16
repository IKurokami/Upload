import { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Boxes } from "@/components/ui/background-boxes";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="text-white p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <span className="text-lg font-semibold">Truyen</span>
          <div className="flex gap-4">
            <Link to="/upload">
              <Button variant="ghost" className="text-white">
                Upload
              </Button>
            </Link>
            <Link to="/albums">
              <Button variant="ghost" className="text-white">
                Albums
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="text-white text-center p-4 mt-4">
        <p>&copy; {new Date().getFullYear()} Truyen. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
