import { AppRouter } from "./routers";
import { ThemeProvider } from "next-themes";
import "./App.css";

function App() {
  return (
    <ThemeProvider attribute="class">
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
