import { Request, Response } from "express";

export const googleLogin = (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Login Backend Test</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>

  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #2563eb, #1e3a8a);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 500px;
      background: #ffffff;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      text-align: center;
    }

    h2 {
      margin-bottom: 20px;
      color: #1e3a8a;
    }

    #buttonDiv {
      margin-bottom: 20px;
    }

    .token-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
    }

    .copy-btn {
      cursor: pointer;
      background: #2563eb;
      border: none;
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      transition: 0.2s ease;
    }

    .copy-btn:hover {
      background: #1e40af;
    }

    pre {
      width: 100%;
      margin: 10px 0;
      text-align: left;
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      overflow-x: auto;
      word-break: break-all;
    }

    .copied {
      color: green;
      font-size: 12px;
      margin-top: 5px;
      display: none;
    }

    @media (max-width: 480px) {
      .container { padding: 18px; }
      pre { font-size: 12px; }
    }
  </style>
</head>
<body>

  <div class="container">
    <h2>Google Login Test</h2>

    <div id="buttonDiv"></div>

    <div class="token-header">
      <h3>Google Token</h3>
      <button class="copy-btn" onclick="copyToken()">📋 Copy</button>
    </div>

    <pre id="tokenBox">None</pre>
    <div id="copiedMsg" class="copied">Copied!</div>

    <h3>Backend Response</h3>
    <pre id="responseBox">None</pre>
  </div>

  <script>
    const GOOGLE_CLIENT_ID = "626050572372-ocuj8p7q304p0gno6v7h5lvjoiv33no9.apps.googleusercontent.com";
    const BACKEND_URL = "/api/v1/user/login-with-google";

    function handleCredentialResponse(response) {
      const token = response.credential;
      document.getElementById("tokenBox").innerText = token;

      fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById("responseBox").innerText =
          JSON.stringify(data, null, 2);
      })
      .catch(err => {
        document.getElementById("responseBox").innerText = err;
      });
    }

    function copyToken() {
      const tokenText = document.getElementById("tokenBox").innerText;
      if (!tokenText || tokenText === "None") return;

      navigator.clipboard.writeText(tokenText).then(() => {
        const msg = document.getElementById("copiedMsg");
        msg.style.display = "block";
        setTimeout(() => {
          msg.style.display = "none";
        }, 1500);
      });
    }

    window.onload = function () {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
      });

      google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large", width: 250 }
      );
    };
  </script>

</body>
</html>
  `);
};

export const kakaoLoginPage = (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kakao Login Backend Test</title>

  <script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>

  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #FEE500, #FFCD00);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 500px;
      background: #ffffff;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      text-align: center;
    }

    h2 { margin-bottom: 20px; }

    #kakaoBtn {
      background: #FEE500;
      border: none;
      padding: 12px 20px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 20px;
    }

    pre {
      width: 100%;
      margin: 10px 0;
      text-align: left;
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      overflow-x: auto;
      word-break: break-all;
    }
  </style>
</head>
<body>

  <div class="container">
    <h2>Kakao Login Test</h2>
    <h2>Backend: ${process.env.KAKAO_CLIENT_ID}</h2>


    <button id="kakaoBtn" onclick="loginWithKakao()">
      Login with Kakao
    </button>

    <h3>Authorization Code</h3>
    <pre id="codeBox">None</pre>

    <h3>Backend Response</h3>
    <pre id="responseBox">None</pre>
  </div>

  <script>
    const KAKAO_CLIENT_ID = "${process.env.KAKAO_CLIENT_ID}";
    const REDIRECT_URI = window.location.origin + "/kakao-test";
    const BACKEND_URL = "/api/v1/user/login-with-kakao";

    Kakao.init(KAKAO_CLIENT_ID);

    function loginWithKakao() {
      window.location.href =
        "https://kauth.kakao.com/oauth/authorize" +
        "?client_id=" + KAKAO_CLIENT_ID +
        "&redirect_uri=" + REDIRECT_URI +
        "&response_type=code";
    }

    // After redirect, extract code
    window.onload = function () {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        document.getElementById("codeBox").innerText = code;

        fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code })
        })
        .then(res => res.json())
        .then(data => {
          document.getElementById("responseBox").innerText =
            JSON.stringify(data, null, 2);
        })
        .catch(err => {
          document.getElementById("responseBox").innerText = err;
        });
      }
    };
  </script>

</body>
</html>
  `);
};