'use strict'

let countdown = null
  , timerIntervalId = null
  , inputStr = '';

sendMessage({
  method: 'getTimer'
}, () => {
  document.getElementById('input').addEventListener('input', (ev) => {
    inputStr = ev.target.value;
    renderInputTimer();
  });
  document.getElementById('input').addEventListener('keyup', (ev) => {
    if (ev.key === 'Enter') setTimer();
  });
  document.getElementById('start').addEventListener('click', setTimer);

  document.getElementById('stop').addEventListener('click', () => {
    sendMessage({ method: 'deleteTimer' });
  });
});

function setTimer() {
  let result = parseInput(inputStr);

  if (result.time) {
    sendMessage({ method: 'setTimer', ...result });
  }
  else if (result.label) {
    sendMessage({ method: 'changeLabel', label: result.label });
  }
  else {
    sendMessage({ method: 'deleteTimer' });
  }
}

function parseInput(str) {
  const UNIT_INDEX = { h: 2, m: 1, s: 0 };

  let match = str.match(/([0-9]{1,2}[hms]?)?[: ]*([0-9]{1,2}[hms]?)?[: ]*([0-9]{1,2}[hms]?)? *(#.+)?/i)
    , values = [];

  if (!match) return { time: 0, timer: formatTime(0), label: null };

  for (let i = 3; i > 0; i--) {
    if (!match[i]) continue;

    let unit = match[i].match(/[hms]$/i);

    if (unit) {
      values[UNIT_INDEX[unit[0].toLowerCase()]] = parseInt(match[i]);
    }
    else {
      for (let j = 0; j < 3; j++) {
        if (values[j] == null) {
          values[j] = parseInt(match[i]);

          break;
        }
      }
    }
  }

  let time = (values[0] || 0) * 1000 + (values[1] || 0) * 60000 + (values[2] || 0) * 3600000;

  return { time, timer: formatTime(time), label: match[4] || null };
}

function renderInputTimer() {
  let result = parseInput(inputStr);

  if (!result.time) {
    if (countdown) {
      if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
      }

      timerIntervalId = setInterval(renderTimer, 1000);
      renderTimer();
    }

    return;
  }

  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }

  document.getElementById('timer').innerText = result.timer;
}

function renderTimer() {
  let time = countdown.timestamp - Date.now();

  if (time <= 0 && timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }

  document.getElementById('timer').innerText = formatTime(time);
}

function formatTime(time) {
  let hours, minutes, seconds;

  hours = Math.max(0, Math.floor(time / 3600000));
  if (hours < 10) hours = '0' + hours;

  time %= 3600000;
  minutes = Math.max(0, Math.floor(time / 60000));
  if (minutes < 10) minutes = '0' + minutes;

  time %= 60000;
  seconds = Math.max(0, Math.floor(time / 1000));
  if (seconds < 10) seconds = '0' + seconds;

  return hours + ':' + minutes + ':' + seconds;
}

function sendMessage(data, callback) {
  chrome.runtime.sendMessage(data, (res) => {
    countdown = res.countdown;

    document.getElementById('input').value = countdown && countdown.label ? countdown.label : '';

    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId);
    }

    if (countdown) {
      timerIntervalId = setInterval(renderTimer, 1000);
      renderTimer();
    }
    else {
      timerIntervalId = null;
      document.getElementById('timer').innerText = formatTime(0);
    }

    callback && callback(res);
  });
}
