import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { RiLeafLine, RiLockPasswordLine, RiMailLine } from "react-icons/ri";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate("/");
      } else {
        setError(res.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@samruddhi.com");
    setPassword("admin123");
    setError("");
  };

  return (
    <div style={containerStyle}>
      {/* Dynamic Background Circles */}
      <div style={circleStyle1}></div>
      <div style={circleStyle2}></div>

      {/* Login Card */}
      <div className="glass-effect" style={cardStyle}>
        <div style={logoContainerStyle}>
          <img 
            src="/logo.png" 
            alt="Samruddhi Organics Logo" 
            style={{ width: "180px", height: "auto", objectFit: "contain", marginBottom: "12px" }} 
          />
          <p style={subtitleStyle}>Commercial Operations ERP</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label className="form-label">Email Address</label>
            <div style={inputWrapperStyle}>
              <RiMailLine style={inputIconStyle} size={18} />
              <input
                type="email"
                placeholder="admin@samruddhi.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={customInputStyle}
                required
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label className="form-label">Password</label>
            <div style={inputWrapperStyle}>
              <RiLockPasswordLine style={inputIconStyle} size={18} />
              <input
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={customInputStyle}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div style={dividerStyle}>
          <span style={dividerTextStyle}>Development Mode</span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleFillDemo}
          style={{ width: "100%", padding: "10px", fontSize: "13px" }}
        >
          Use Demo Credentials
        </button>
      </div>
    </div>
  );
}

// Styling definitions
const containerStyle = {
  position: "relative",
  width: "100vw",
  height: "100vh",
  background: "#04140e", // Deep organic green-black
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const circleStyle1 = {
  position: "absolute",
  width: "400px",
  height: "400px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)",
  top: "-100px",
  left: "-100px",
};

const circleStyle2 = {
  position: "absolute",
  width: "500px",
  height: "500px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(5,150,105,0.12) 0%, rgba(0,0,0,0) 70%)",
  bottom: "-150px",
  right: "-100px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "24px",
  padding: "40px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  animation: "fadeIn 0.5s ease-out",
  zIndex: 10,
  background: "rgba(10, 20, 16, 0.8)", // Dark green transparent
  border: "1px solid rgba(16, 185, 129, 0.15)",
};

const logoContainerStyle = {
  textAlign: "center",
  marginBottom: "32px",
};

const iconBgStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "18px",
  background: "rgba(16, 185, 129, 0.1)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
  border: "1px solid rgba(16, 185, 129, 0.2)",
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#ffffff",
  marginBottom: "4px",
  letterSpacing: "-0.02em",
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#a7f3d0", // Light mint
  opacity: 0.8,
};

const errorStyle = {
  background: "rgba(239, 68, 68, 0.1)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#f87171",
  padding: "12px 16px",
  borderRadius: "12px",
  fontSize: "13px",
  marginBottom: "24px",
  textAlign: "center",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const inputGroupStyle = {
  display: "flex",
  flexDirection: "column",
};

const inputWrapperStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const inputIconStyle = {
  position: "absolute",
  left: "14px",
  color: "#4ade80",
  opacity: 0.6,
};

const customInputStyle = {
  paddingLeft: "42px",
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
  color: "#ffffff",
};

const dividerStyle = {
  display: "flex",
  alignItems: "center",
  textAlign: "center",
  margin: "24px 0 16px 0",
};

const dividerTextStyle = {
  width: "100%",
  fontSize: "11px",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};
