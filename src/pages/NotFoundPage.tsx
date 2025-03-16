import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const animationContainer = useRef(null);

  useEffect(() => {
    if (animationContainer.current) {
      const anim = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/404.json",
      });

      return () => anim.destroy();
    }
  }, []);

  const goToHomePage = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="max-w-md w-full px-6 py-8 rounded-lg text-center">
        <h1 className="text-4xl font-bold mb-2">Oops!</h1>
        <h2 className="text-2xl font-semibold mb-4">404 - Page Not Found</h2>

        <div
          ref={animationContainer}
          className="w-100% h-100% mx-auto my-6"
        ></div>

        <p className="mb-6">
          The page you're looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        <Button onClick={goToHomePage}>
          <Home className="mr-2" size={18} />
          Back to Home
        </Button>
      </div>
    </div>
  );
};
