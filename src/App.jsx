import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/Approutes";
import ProtocolGuide from "./pages/ProtocolGuide"; 

function App() {
  return (
    <AuthProvider>
      {/* Added app-layout class here */}
      <div className="app-layout">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;
