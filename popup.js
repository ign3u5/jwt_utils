let jwt = require("jsonwebtoken");
let getAccessToken = document.getElementById("getAccessToken");
let setAccessToken = document.getElementById("updateAccessToken");
let dataPayload = document.getElementById("dataPayload");
let storedSecret;

chrome.storage.sync.get("secret", ({ secret }) => {
  storedSecret = secret;
})
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
  },([accessToken]) => {
    let plaintext = Buffer.from(storedSecret, 'base64');
    let previousDataPayload = jwt.verify(accessToken.result, plaintext);
    dataPayload.value = JSON.stringify(previousDataPayload, null, 2);
    chrome.storage.sync.set({previousDataPayload});
  });
});

setAccessToken.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let previousDataPayload = dataPayload.value;
  chrome.storage.sync.set({previousDataPayload});
  let plaintest = Buffer.from(storedSecret, 'base64');
  var token = jwt.sign(JSON.parse(dataPayload.value), plaintest);
  chrome.scripting.executeScript({
    args: [token],
    target: { tabId: tab.id },
    function: setAccessTokenInPage
  });
  log("Updating token to ", token);
})

function getAccessTokenFromPage() {
  return localStorage.getItem("access_token");
}

function setAccessTokenInPage(accessToken) {
  console.log(accessToken);
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