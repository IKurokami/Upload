import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AnimatedOutlet from "@/components/animation/AnimatedOutlet";
import { TopLoadingBar } from "@/components/animation/TopLoadingBar";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, FileUp, Album, ScrollText, Settings, Languages } from "lucide-react";
import { ArcrylicBgProvider } from "@/contexts/ArcrylicBgContext";
import { Toaster } from "sonner";
import { getDataFromDB } from "@/lib/db";
import { AnimatePresence, motion } from "framer-motion";
import { useNavAnimation } from "@/contexts/NavAnimationContext";
import { NavBackgroundAnimation } from "@/components/animation/NavBackgroundAnimation";

const MainLayout = () => {
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const { setNavBoundingBox } = useNavAnimation();

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const storedKey = await getDataFromDB<string>("apiKey");
        setApiKey(storedKey || null);
      } catch (e) {
        // ignore
      }
    };
    loadApiKey();

    // Add event listener to detect changes in API key
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "apiKey" || event.key === null) {
        const updatedKey = await getDataFromDB<string>("apiKey");
        setApiKey(updatedKey || null);
      }
    };

    // Setup custom event listener for API key changes
    const handleCustomStorageChange = async () => {
      const updatedKey = await getDataFromDB<string>("apiKey");
      setApiKey(updatedKey || null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("apiKeyChanged", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("apiKeyChanged", handleCustomStorageChange);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setProgress(80);

    let frame: number;
    let value = 0;
    function animate() {
      value += Math.random() * 50 + 5;
      if (value < 90) {
        setProgress(value);
        frame = window.setTimeout(animate, 100);
      } else {
        setProgress(100);
        frame = window.setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }
    }
    animate();

    return () => {
      clearTimeout(frame);
    };
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const [arcrylicBg, setArcrylicBg] = useState(false);

  useEffect(() => {
    const checkArcrylic = () => {
      const html = document.documentElement;
      const isDark = html.classList.contains("dark");
      const subTheme = localStorage.getItem("darkSubTheme");
      setArcrylicBg(isDark && subTheme === "arcrylic");
    };
    checkArcrylic();
    window.addEventListener("storage", checkArcrylic);
    const observer = new MutationObserver(checkArcrylic);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      window.removeEventListener("storage", checkArcrylic);
      observer.disconnect();
    };
  }, []);

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };

  // Helper to handle nav click and set bounding box
  const handleNavClick = (e: React.MouseEvent) => {
    // Don't proceed if clicking on the currently active item
    if ((e.currentTarget as HTMLElement).classList.contains('active-nav-item')) {
      return;
    }
    
    // Get the button element's exact position in the viewport
    const button = e.currentTarget.querySelector('button');
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      
      // Set the nav bounding box with client coordinates (viewport-relative)
      setNavBoundingBox({
        top: buttonRect.top,
        left: buttonRect.left,
        width: buttonRect.width,
        height: buttonRect.height,
      });
    }
  };

  // Initialize the active navigation position when component mounts
  useEffect(() => {
    // Initialize position after a short delay to ensure DOM is ready
    const initialTimer = setTimeout(() => {
      // Find the active navigation button based on current route
      let route = location.pathname;
      if (route === '/') route = '/Upload/Upload'; // Default route
      
      const selector = `.nav-item-${route.replace(/\//g, "-").replace(/^-/, "")}`;
      console.log("Looking for active nav item with selector:", selector);
      
      const activeBtn = document.querySelector(selector);
      
      if (activeBtn) {
        console.log("Found active button:", activeBtn);
        const rect = activeBtn.getBoundingClientRect();
        setNavBoundingBox({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        console.log("No active navigation button found");
      }
    }, 300);
    
    return () => clearTimeout(initialTimer);
  }, []); // Only on mount
  
  // Update position when route changes
  useEffect(() => {
    // Wait for the route transition to complete
    const routeTimer = setTimeout(() => {
      // Find the active navigation button based on current route
      let route = location.pathname;
      if (route === '/') route = '/Upload/Upload'; // Default route
      
      const activeNavButton = document.querySelector(
        `.nav-item-${route.replace(/\//g, "-").replace(/^-/, "")}`
      );
      
      // If an active button is found, set its bounding box
      if (activeNavButton) {
        const activeRect = activeNavButton.getBoundingClientRect();
        setNavBoundingBox({
          top: activeRect.top,
          left: activeRect.left,
          width: activeRect.width,
          height: activeRect.height,
        });
      }
    }, 50);

    return () => clearTimeout(routeTimer);
  }, [location.pathname, setNavBoundingBox]);

  return (
    <ArcrylicBgProvider value={arcrylicBg}>
      <div
        className={`flex flex-col min-h-screen ${arcrylicBg ? " app-blur-bg" : ""
          }`}
      >
        {/* Top Loading Bar */}
        <TopLoadingBar progress={progress} isLoading={isLoading} />
        
        {/* Navigation background animation */}
        <NavBackgroundAnimation />
        
        {/* Header */}
        <header className="backdrop-blur-xs border-b sticky top-0 z-50">
          <nav className="container mx-auto flex justify-between items-center p-4">
            <Link to="/Upload/Upload" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <span className="font-bold">Truyen</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent">
                Truyen
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-1 relative nav-container" style={{ position: 'relative' }}>
              {/* Navigation items */}
              <motion.div
                key="upload-btn"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={itemVariants}
              >
                <Link to="/Upload/Upload">
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 w-32 justify-start relative z-10 nav-item-Upload-Upload ${
                      isActive("/Upload/Upload") ? "text-primary-foreground active-nav-item !opacity-100" : ""
                    }`}
                    onClick={handleNavClick}
                  >
                    <FileUp size={18} />
                    <span>Upload</span>
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                key="albums-btn"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={itemVariants}
              >
                <Link to="/Upload/albums">
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 w-32 justify-start relative z-10 nav-item-Upload-albums ${
                      isActive("/Upload/albums") ? "text-primary-foreground active-nav-item !opacity-100" : ""
                    }`}
                    onClick={handleNavClick}
                  >
                    <Album size={18} />
                    <span>Albums</span>
                  </Button>
                </Link>
              </motion.div>

              <AnimatePresence>
                {apiKey && (
                  <>
                    <motion.div
                      key="ocr-btn"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={itemVariants}
                    >
                      <Link to="/Upload/ocr">
                        <Button
                          variant="ghost"
                          className={`flex items-center gap-2 w-32 justify-start relative z-10 nav-item-Upload-ocr ${
                            isActive("/Upload/ocr") ? "text-primary-foreground active-nav-item !opacity-100" : ""
                          }`}
                          onClick={handleNavClick}
                        >
                          <ScrollText size={18} />
                          <span>OCR</span>
                        </Button>
                      </Link>
                    </motion.div>

                    <motion.div
                      key="translate-btn"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={itemVariants}
                    >
                      <Link to="/Upload/translate">
                        <Button
                          variant="ghost"
                          className={`flex items-center gap-2 w-32 justify-start relative z-10 nav-item-Upload-translate ${
                            isActive("/Upload/translate") ? "text-primary-foreground active-nav-item !opacity-100" : ""
                          }`}
                          onClick={handleNavClick}
                        >
                          <Languages size={18} />
                          <span>Translate</span>
                        </Button>
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile navigation */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border">
                  <DropdownMenuItem>
                    <Link
                      to="/Upload/Upload"
                      className="flex items-center gap-2 w-full"
                      onClick={handleNavClick}
                    >
                      <FileUp size={18} />
                      <span>Upload</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      to="/Upload/albums"
                      className="flex items-center gap-2 w-full"
                      onClick={handleNavClick}
                    >
                      <Album size={18} />
                      <span>Albums</span>
                    </Link>
                  </DropdownMenuItem>

                  {apiKey && (
                    <>
                      <DropdownMenuItem>
                        <Link to="/Upload/ocr" className="flex items-center gap-2 w-full" onClick={handleNavClick}>
                          <ScrollText size={18} />
                          <span>OCR</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to="/Upload/translate" className="flex items-center gap-2 w-full" onClick={handleNavClick}>
                          <Languages size={18} />
                          <span>Translate</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem>
                    <Link
                      to="/Upload/settings"
                      className="flex items-center gap-2 w-full"
                      onClick={handleNavClick}
                    >
                      <Settings size={18} />
                      <span>{apiKey ? "Gemini" : "Settings"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="w-full flex justify-center">
                      <ThemeSwitcher />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Right side: Theme switcher and Settings (desktop only) */}
            <div className="hidden md:flex items-center gap-2 relative nav-container">
              <ThemeSwitcher />
              <Link to="/Upload/settings">
                <Button
                  variant="ghost"
                  className={`flex items-center gap-2 w-32 justify-start relative z-10 nav-item-Upload-settings ${
                    isActive("/Upload/settings") ? "text-primary-foreground active-nav-item !opacity-100" : ""
                  }`}
                  onClick={handleNavClick}
                >
                  <Settings size={18} />
                  <motion.span
                    key={apiKey ? "gemini-text" : "settings-text"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {apiKey ? "Gemini" : "Settings"}
                  </motion.span>
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section - Only on homepage */}
        {location.pathname === "/" && (
          <div className="relative py-20 px-4 overflow-hidden">
            <div className="absolute inset-0 z-0"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl z-0"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl z-0"></div>

            <div className="container mx-auto relative z-10 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent">
                Truyen Platform
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                The next generation content management system powered by
                blockchain technology
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="border-0">Get Started</Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto">
          <AnimatedOutlet />
        </main>

        {/* Toaster */}
        <Toaster position="top-right" />
      </div>
    </ArcrylicBgProvider>
  );
};

export default MainLayout;
