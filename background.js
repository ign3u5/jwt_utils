// import * as jose from "./jose/index.js";
// import { Hello } from "./something.js";
let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

console.log("Working!");