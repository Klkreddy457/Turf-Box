import { BrowserRouter } from "react-router-dom";

import NavBar from "./components/NavBar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <NavBar />

      <main className="main-content">
        <AppRoutes />
      </main>
    </BrowserRouter>
  );
}

export default App;