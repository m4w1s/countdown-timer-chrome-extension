'use strict'

let countdown = null
  , timerTimeoutId = null
  , notificationAudio = new Audio(chrome.runtime.getURL('sounds/notification.mp3'));

chrome.runtime.onMessage.addListener((req, sender, respond) => {
  switch (req.method) {
    case 'setTimer':
      countdown = {
        timestamp: Date.now() + req.time,
        timer: req.timer,
        label: req.label
      };

      if (timerTimeoutId !== null) {
        clearTimeout(timerTimeoutId);
      }

      timerTimeoutId = setTimeout(showNotification, req.time);

      break;
    case 'changeLabel':
      if (countdown) {
        countdown.label = req.label;
      }

      break;
    case 'deleteTimer':
      if (timerTimeoutId !== null) {
        clearTimeout(timerTimeoutId);
        timerTimeoutId = null;
      }

      countdown = null;
  }

  respond({ countdown });
});

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  if (byUser) notificationAudio.pause();
});

function showNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.extension.getURL('icons/icon256.png'),
    title: 'Timer Finished',
    message: countdown.timer,
    contextMessage: countdown.label,
    requireInteraction: true,
    silent: true
  });

  notificationAudio.currentTime = 0;
  notificationAudio.play();

  countdown = null;
  timerTimeoutId = null;
}
