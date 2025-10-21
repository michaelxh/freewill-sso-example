import {
  Auth0Provider as BaseAuth0Provider,
  useAuth0,
} from "@auth0/auth0-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";

interface DecodedToken {
  header: any;
  payload: any;
  signature: string;
}

interface ApiResponse {
  data: any;
  status: number;
  statusText: string;
  timestamp: string;
}

function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated, logout, loginWithRedirect, getAccessTokenSilently } =
    useAuth0();

  const decodeJWT = (token: string): DecodedToken | null => {
    try {
      // Decode the payload using jwt-decode
      const payload = jwtDecode(token);

      // Extract header and signature manually since jwt-decode only returns payload
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      const [headerEncoded, , signature] = parts;

      // Decode header manually
      const header = JSON.parse(
        atob(headerEncoded.replace(/-/g, "+").replace(/_/g, "/"))
      );

      return {
        header,
        payload,
        signature,
      };
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently().then((token) => {
        console.log("Token:", token);
        setAccessToken(token);
        const decoded = decodeJWT(token);
        setDecodedToken(decoded);
      });
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const callPublicApi = async () => {
    setIsLoading(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const response = await axios.get("http://localhost:3000/");
      setApiResponse({
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const callProtectedApi = async () => {
    if (!accessToken) {
      setApiError("No access token available");
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const response = await axios.get("http://localhost:3000/protected", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setApiResponse({
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <header className="header">
        <h1>FreeWill SSO Example</h1>
        {isAuthenticated ? (
          <div className="auth-status">
            <span className="status-indicator">✓ Authenticated</span>
            <button className="logout-btn" onClick={() => logout()}>
              Logout
            </button>
            <div className="api-buttons">
              <button
                className="api-btn public-api-btn"
                onClick={callPublicApi}
                disabled={isLoading}
              >
                {isLoading ? "⏳ Loading..." : "🌐 Call Public API"}
              </button>
              <button
                className="api-btn protected-api-btn"
                onClick={callProtectedApi}
                disabled={isLoading || !accessToken}
              >
                {isLoading ? "⏳ Loading..." : "🔒 Call Protected API"}
              </button>
            </div>
          </div>
        ) : (
          <button className="login-btn" onClick={() => loginWithRedirect()}>
            Login with Auth0
          </button>
        )}
      </header>{" "}
      {/* API Response Card */}
      {(apiResponse || apiError) && (
        <div className="card api-response-card">
          <h2>API Response</h2>

          {apiError && (
            <div className="api-error">
              <h3>❌ Error</h3>
              <p className="error-message">{apiError}</p>
            </div>
          )}

          {apiResponse && (
            <div className="api-success">
              <h3>✅ Success</h3>
              <div className="response-info">
                <p>
                  <strong>Status:</strong> {apiResponse.status}{" "}
                  {apiResponse.statusText}
                </p>
                <p>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(apiResponse.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="response-data">
                <h4>Response Data:</h4>
                <pre className="json-display">
                  {JSON.stringify(apiResponse.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      {isAuthenticated && (
        <div className="content">
          {/* Access Token Card */}
          {accessToken && (
            <div className="card token-card">
              <h2>Access Token</h2>
              <div className="token-container">
                <div className="token-display">
                  <code className="token-text">{accessToken}</code>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(accessToken)}
                  title="Copy to clipboard"
                >
                  📋 Copy Token
                </button>
              </div>
              <div className="token-info">
                <p className="token-length">
                  Token length: {accessToken.length} characters
                </p>
                <p className="token-preview">
                  Preview: {accessToken.substring(0, 50)}...
                </p>
              </div>

              {/* JWT Decoded Content */}
              {decodedToken && (
                <div className="jwt-decoded">
                  <h3>JWT Contents</h3>

                  <div className="jwt-section">
                    <h4>Header</h4>
                    <div className="jwt-content">
                      <pre className="json-display">
                        {JSON.stringify(decodedToken.header, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="jwt-section">
                    <h4>Payload</h4>
                    <div className="jwt-content">
                      <pre className="json-display">
                        {JSON.stringify(decodedToken.payload, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="jwt-section">
                    <h4>Signature</h4>
                    <div className="jwt-signature">
                      <code>{decodedToken.signature}</code>
                    </div>
                  </div>

                  {/* Token Expiry Information */}
                  {decodedToken.payload.exp && (
                    <div className="token-expiry">
                      <h4>Token Information</h4>
                      <div className="expiry-info">
                        <p>
                          <strong>Issued At:</strong>{" "}
                          {new Date(
                            decodedToken.payload.iat * 1000
                          ).toLocaleString()}
                        </p>
                        <p>
                          <strong>Expires At:</strong>{" "}
                          {new Date(
                            decodedToken.payload.exp * 1000
                          ).toLocaleString()}
                        </p>
                        <p>
                          <strong>Time Until Expiry:</strong>{" "}
                          {Math.max(
                            0,
                            Math.floor(
                              (decodedToken.payload.exp * 1000 - Date.now()) /
                                1000 /
                                60
                            )
                          )}{" "}
                          minutes
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Auth0Provider({ children }: { children: React.ReactNode }) {
  return (
    <BaseAuth0Provider
      domain="TODO"
      clientId="TODO"
      authorizationParams={{
        audience: "TODO",
        redirect_uri: window.location.origin,
      }}
    >
      {children}
    </BaseAuth0Provider>
  );
}

function App() {
  return (
    <Auth0Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </Auth0Provider>
  );
}

export default App;
