import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function AnimatedOutlet() {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [direction, setDirection] = useState(1);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  function countSegments(path: string) {
    return path.split("/").filter(Boolean).length;
  }

  useEffect(() => {
    const prevSegments = countSegments(prevPath);
    const currSegments = countSegments(location.pathname);

    let newDirection = 1;
    if (prevSegments <= 1) {
      newDirection = 1;
    } else if (currSegments < prevSegments) {
      newDirection = -1;
    } else {
      newDirection = 1;
    }

    setDirection(newDirection);
    setPrevPath(location.pathname);
  }, [location.pathname]);

  // Mobile detection
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation variants
  const desktopVariants = {
    initial: () => ({
      y: -150,
      scale: 0.1,
      opacity: 0,
      width: "75%",
      height: "10%",
    }),
    animate: {
      y: 0,
      scale: 1,
      opacity: 1,
      width: "100%",
      height: "calc(100vh - 100px)",
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 3,
      },
    },
    exit: {
      y: -150,
      scale: 0.98,
      opacity: 1,
      width: "100%",
      height: "100%",
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 0.1,
      },
    },
  };

  const settingsVariants = {
    initial: () => ({
      x: 1000,
      scale: 0.5,
      opacity: 0,
      width: "10%",
      height: "0%",
    }),
    animate: {
      x: 0,
      scale: 1,
      opacity: 1,
      width: "100%",
      height: "100%",
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 3,
      },
    },
    exit: {
      x: -100,
      scale: 0.98,
      opacity: 0,
      width: "100%",
      height: "100%",
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 40,
        mass: 1.5,
        duration: 0.1,
      },
    },
  };

  const mobileVariants = {
    initial: {
      y: 40,
      scale: 0.92,
      opacity: 0,
      width: "100%",
    },
    animate: {
      y: 0,
      scale: 1,
      opacity: 1,
      width: "100%",
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 28,
        mass: 1,
        duration: 1,
      },
    },
    exit: {
      y: -20,
      scale: 0.96,
      opacity: 0,
      width: "100%",
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 28,
        mass: 1,
        duration: 0.1,
      },
    },
  };

  // Get variants based on current path
  const getVariants = () => {
    if (location.pathname === "/settings") {
      return isMobile ? mobileVariants : settingsVariants;
    }
    return isMobile ? mobileVariants : desktopVariants;
  };

  return (
    <div style={{ position: "relative", minHeight: "60vh" }}>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={getVariants()}
          initial="initial"
          animate="animate"
          style={{
            position: "absolute",
            width: "100%",
            transformOrigin: "center center",
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
