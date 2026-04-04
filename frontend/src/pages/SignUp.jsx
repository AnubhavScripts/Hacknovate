import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SignUpImage from "../assets/signup.png"
import { useOnboardingStore } from "../store/onboardingStore";
import { useUser } from "../context/UserContext";
import { signupApi } from "../services/api";

function Signup() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { setUserInfo } = useOnboardingStore();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlesignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Store user info in onboarding store
      setUserInfo({ name, email });
      
      // Call the backend signup API
      const { data } = await signupApi({ email, name, password });
      
      // Set user in context
      setUser(data.user);
      
      // Redirect to onboarding flow
      navigate(data.redirectTo || "/onboarding");
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Signup failed. Please try again.";
      setError(errorMessage);
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <form className="login-box" onSubmit={handlesignup}>
          <h2>Create Account</h2>
          <p className="subtitle">Sign up to get started</p>
          
          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: 8, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Enter your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <p className="link-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} style={{ cursor: "pointer", color: "#0066cc" }}>
              Login
            </span>
          </p>
        </form>
      </div>
      <div
        className="login-image"
        style={{ backgroundImage: `url(${SignUpImage})` }}
      >
        <div className="overlay"></div>
      </div>
    </div>
  );
}

export default Signup;
