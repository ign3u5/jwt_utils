let jwt = require("jsonwebtoken");
let getAccessToken = document.getElementById("getAccessToken");
let setAccessToken = document.getElementById("updateAccessToken");
let dataPayload = document.getElementById("dataPayload");

chrome.storage.sync.get("previousDataPayload", ({ previousDataPayload }) => {
  if (typeof(previousDataPayload) == "object")
    dataPayload.value = JSON.stringify(previousDataPayload, null, 2);
  else
    dataPayload.value = previousDataPayload;
})

getAccessToken.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getAccessTokenFromPage
  },async ([accessToken]) => {
    log("Access token:", accessToken.result);
    let currentJwtClaims = await getClaimsFromToken(tab.url, accessToken.result);
    cachePayload(currentJwtClaims);
    dataPayload.value = JSON.stringify(currentJwtClaims, null, 2);
  });
});

async function getClaimsFromToken(url, token) {
  let environment = getEnvironment(url);
  log("Environment:", environment);
  var secret = await getSecretFromConsul(environment);
  log("Secret:", secret);
  let plaintext = Buffer.from(secret, 'base64');
  return jwt.verify(token, plaintext);
}

setAccessToken.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let environment = getEnvironment(tab.url);
  log("Environment:", environment);

  var secret = await getSecretFromConsul(environment);
  log("Retrieved secret", secret);

  cachePayload(dataPayload.value);

  let plaintest = Buffer.from(secret, 'base64');
  var token = jwt.sign(JSON.parse(dataPayload.value), plaintest);
  chrome.scripting.executeScript({
    args: [token],
    target: { tabId: tab.id },
    function: setAccessTokenInPage
  });
  log("Updating token to ", token);
})

function getEnvironment(url) {
  if (url.indexOf("hencpdev") != -1) return "encpublishing/dev";
  if (url.indexOf("htestdat") != -1) return "encpublishing/dat";
  if (url.indexOf("hencpat1") != -1) return "encpublishing/at1";
  if (url.indexOf("localhost") != -1) return "localdev";
  return "unknown";
}

async function getSecretFromConsul(env) {
  return await fetch(`https://hconengapp01/v1/kv/${env}/encprocess/global/security`)
  .then(response => response.json())
  .then(([data]) => {
    log("Data:", JSON.parse(atob(data.Value)).JwtCurrentSecret);
    return JSON.parse(atob(data.Value)).JwtCurrentSecret
  });
}

function cachePayload(previousDataPayload) {
  chrome.storage.sync.set({previousDataPayload});
}

function getAccessTokenFromPage() {
  let token = localStorage.getItem("access_token");
  console.log(token);
  return token;
}

function setAccessTokenInPage(accessToken) {
  localStorage.setItem("access_token", accessToken);
}

async function log(...value) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    args: [value],
    target: { tabId: tab.id },
    function: (value) => console.log(...value)
  });
}