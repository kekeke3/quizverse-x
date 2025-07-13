import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import QuizDetail from "./pages/QuizDetail";
import QuizRoom from "./pages/QuizRoom";
import Performance from "./pages/Performance";
import Admin from "./pages/Admin";
import { Navbar } from "./component/shared/Navbar";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz/:id" element={<QuizDetail />} />
                <Route path="/quiz/rooms/:roomCode" element={<QuizRoom />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </div>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
