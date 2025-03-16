import { Card, CardContent } from "@/components/ui/card";

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-lg shadow-lg relative z-20 mt-8">
        <CardContent className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">
            Welcome to Truyen
          </h1>
          <p className="text-gray-300">
            Start by navigating to Upload HTML or Albums.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
