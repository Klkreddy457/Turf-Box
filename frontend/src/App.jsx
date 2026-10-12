import { BrowserRouter } from "react-router-dom";

import NavBar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <NavBar />

      <main className="main-content">
        <AppRoutes />
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;