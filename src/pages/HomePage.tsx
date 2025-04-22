import { Card, CardHeader, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileUp, Album, ScrollText, ArrowRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// Define key features for display
const features = [
  {
    title: "Upload HTML",
    description: "Quickly upload and process your HTML files.",
    icon: <FileUp className="w-8 h-8 text-primary" />,
    link: "/Upload/Upload",
    action: "Upload now",
  },
  {
    title: "View Albums",
    description: "Browse and manage your saved albums.",
    icon: <Album className="w-8 h-8 text-primary" />,
    link: "/Upload/albums",
    action: "View albums",
  },
  {
    title: "Extract Text",
    description: "Perform OCR on images and extract valuable text.",
    icon: <ScrollText className="w-8 h-8 text-primary" />,
    link: "/Upload/ocr",
    action: "Start OCR",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const HomePage = () => (
  <div className="relative flex flex-col items-center min-h-screen">
    {/* Hero Section with Gradient Background */}
    <div className="w-full bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Truyen
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Your all-in-one platform for uploading HTML, organizing albums, and extracting text.
        </motion.p>
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link to="/Upload/Upload">
            <Button variant="default" size="lg" className="group">
              Upload HTML
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/Upload/albums">
            <Button variant="outline" size="lg" className="group">
              View Albums
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>

    {/* Features Grid */}
    <section className="py-20 w-full bg-background px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Powerful Features
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map(({ title, description, icon, link, action }) => (
            <motion.div key={title} variants={item}>
              <Card className="shadow-sm hover:shadow-lg transition-all duration-300 h-full border-muted/40 overflow-hidden group">
                <CardHeader className="flex items-center gap-4 pb-2 bg-muted/10">
                  <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    {icon}
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardDescription className="px-6 py-4 text-sm">{description}</CardDescription>
                <CardFooter className="px-6 pb-5 pt-2">
                  <Link to={link} className="w-full">
                    <Button variant="secondary" className="w-full group">
                      {action}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="w-full bg-gradient-to-br from-secondary/10 via-background to-primary/10 py-16 px-4">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Start using Truyen today and transform how you manage your content.
        </p>
        <Link to="/Upload/Upload">
          <Button size="lg" className="group">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </motion.div>
    </section>

    {/* Footer */}
    <footer className="w-full py-8 px-4 border-t bg-background">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h3 className="font-bold text-lg">Truyen</h3>
          <p className="text-sm text-muted-foreground">Your content management solution</p>
        </div>
        <div className="flex gap-8">
          <Link to="/Upload/Upload" className="text-sm hover:text-primary transition-colors">Upload</Link>
          <Link to="/Upload/albums" className="text-sm hover:text-primary transition-colors">Albums</Link>
          <Link to="/Upload/ocr" className="text-sm hover:text-primary transition-colors">OCR</Link>
        </div>
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Truyen. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
);

export default HomePage;
