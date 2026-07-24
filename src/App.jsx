import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/Approutes";


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
