import React, { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import "./App.scss";

function App(props) {
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcode this because our frontend does not have Cognito login yet
  const cognito_token = "eyJraWQiOiJUUDgwTG45aHI2WG1oZTZlUWdxMk50YXdKcUFvRSs1VzAwQlwvcDYxN1pzST0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIyOTIzODdjYy1kNTkwLTRmYzctODQwYS05MGIxOWM2YzNjOGMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTFfTlVYTlNxbDhnIiwiY2xpZW50X2lkIjoiNjVlczM0Z3Q4cG4xcGtoM3FicjZ0YjE3aDMiLCJvcmlnaW5fanRpIjoiMjAyNGIyMTUtOTMxNS00NDgyLWEyM2YtOWI3ZWUxNmQxMzExIiwiZXZlbnRfaWQiOiI4Y2FkOTkwNS1mMTU3LTRlMGYtYWMwNi1mNzlkMDQ1NTBjZGUiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNjc2OTA3MjAxLCJleHAiOjE2NzY5MTA4MDEsImlhdCI6MTY3NjkwNzIwMSwianRpIjoiMDg2YTNhZjktMTY5MS00YzYxLWE2MjQtZGNmYmIzNmUwNjZmIiwidXNlcm5hbWUiOiJ0ZXN0In0.kfYBjeEM-DlK3CJCWpWK5pUw5aCkWzxNo__LT8e1EtUr5ttdF0CE38jp23fC-s_JI1w-5MF0xeyGW6Lwg2xcRUtUZlVVOlcDPgU3SdzssXx1DBn0UrCJaFFxcKDDdTOepuYhXpsKMfXvB9a7uiys0MIaml_uXldNLIMu-PAL3bAktw-qEAep1swPeUL_ygLhG2CXzGS-r6i69KQCN7DI1xWbOWpd8RbMZG4qLF3j0q_HfbMZmdKWb_p77R_bx1Dhafg3zJMZhvxqi6RKhxG4buBuWxTSKU-o952FIDRhprHLWpjVQfGyPp9Ch5fvnn-wPqMtCOmTaeMfi-MeZgXwTg"

  const onSuccess = useCallback(async (publicToken, metadata) => {
    const firstAccountID = metadata.accounts[0].id
    setLoading(true);
    const response = await fetch("http://localhost:8000/plaid/exchange_public_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": cognito_token,
      },
      body: JSON.stringify({ public_token: publicToken, account_id: firstAccountID }),
    });
    const data = await response.json(); // Contains processor token
    console.log(JSON.stringify(data));
  }, []);

  // Creates a Link token
  const createLinkToken = React.useCallback(async () => {
    // For OAuth, use previously generated Link token
    if (window.location.href.includes("?oauth_state_id=")) {
      const linkToken = localStorage.getItem('link_token');
      setToken(linkToken);
    } else {
      const response = await fetch("http://localhost:8000/plaid/create_link_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access-token": cognito_token,
        },
      });
      const data = await response.json();
      const linkToken = data.link_token
      setToken(linkToken);
      localStorage.setItem("link_token", linkToken);
    }
  }, [setToken]);

  let isOauth = false;

  const config = {
    token,
    onSuccess,
    env: "sandbox",
  };

  // For OAuth, configure the received redirect URI
  if (window.location.href.includes("?oauth_state_id=")) {
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }
  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (token == null) {
      createLinkToken();
    }
    if (isOauth && ready) {
      open();
    }
  }, [token, isOauth, ready, open, createLinkToken]);
  
  return (
    <div>
      <div>
        <button onClick={() => open()
          } disabled={!ready}>
          <strong>Link account!</strong>
        </button>

        {!loading &&
          data != null &&
          Object.entries(data).map((entry, i) => (
            <pre key={i}>
              <code>{JSON.stringify(entry[1], null, 2)}</code>
            </pre>
          )
        )}
      </div>
    </div>
  );
}

export default App;