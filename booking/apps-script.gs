/**
 * Booking backend for your massage booking page.
 *
 * Paste this whole file into a Google Sheet: Extensions > Apps Script.
 * SETUP.md walks you through it step by step.
 *
 * Every booking becomes a row in the "Bookings" tab:
 *   - Change a row's Status to "Cancelled" and that time is free again.
 *   - Add your own row with Status "Blocked" to block off time
 *     (fill in Date, Start and End; leave Start/End empty to block the whole day).
 */

// ---- EDIT THESE ----------------------------------------------------------
var SETTINGS = {
  businessName: 'Magic Massage Rockhampton',
  phone: '(07) 4921 1516',
  address: 'Shop 097, Stockland Rockhampton, 120-311 Yaamba Rd, Park Avenue QLD 4701 (next to Bright Eyes, near Woolworths)',
  policy: 'Pay at the shop after your treatment. HICAPS health fund claiming available.',
  notifyEmail: '',        // where new-booking emails go. Empty = the Google account you deploy with.
  emailCustomers: true,   // email customers a confirmation when they give an email address
  bufferMinutes: 15,      // break after each massage. Keep the same as bufferMinutes in index.html.
  clock24: false          // true writes 14:30 in emails instead of 2:30pm
};
// --------------------------------------------------------------------------

var SHEET_NAME = 'Bookings';
var HEADERS = ['Booked at', 'Ref', 'Status', 'Date', 'Start', 'End', 'Massage', 'Minutes', 'Price',
  'Name', 'Phone', 'Email', 'Notes', 'First visit', 'Source', 'Campaign', 'Ad', 'fbclid'];
var COL = { status: 2, date: 3, start: 4, end: 5 };   // 0-based positions in HEADERS

/** Run this once from the editor (select "setup", press Run) to create the tab and grant permissions. */
function setup() {
  getSheet_();
  Logger.log('Ready. Bookings will appear in the "' + SHEET_NAME + '" tab.');
}

/** GET ?action=busy&from=YYYY-MM-DD&to=YYYY-MM-DD returns the taken times (no customer details). */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'busy') {
      if (!isDate_(p.from) || !isDate_(p.to)) return json_({ ok: false, error: 'bad_range' });
      var list = taken_(p.from, p.to).map(function (t) {
        return { date: t.date, start: hhmm_(t.start), end: hhmm_(t.end) };
      });
      return json_({ ok: true, busy: list });
    }
    return json_({ ok: true, message: 'Booking system is running.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/** POST a booking (JSON body) from the booking page. */
function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }

  var problem = check_(b);
  if (problem) return json_({ ok: false, error: problem });

  var start = toMin_(b.start);
  var end = start + Number(b.minutes);
  var ref;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return json_({ ok: false, error: 'busy_try_again' });
  try {
    var buf = SETTINGS.bufferMinutes || 0;
    var clash = taken_(b.date, b.date).some(function (t) {
      return start < t.end + buf && end + buf > t.start;
    });
    if (clash) return json_({ ok: false, error: 'taken' });

    ref = newRef_();
    getSheet_().appendRow([
      new Date(), ref, 'Booked', b.date, hhmm_(start), hhmm_(end),
      cell_(b.service), Number(b.minutes), Number(b.price) || '',
      cell_(b.name), cell_(b.phone), cell_(b.email), cell_(b.notes),
      b.firstVisit ? 'Yes' : '', cell_(b.source), cell_(b.campaign), cell_(b.ad), cell_(b.fbclid)
    ]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  try { sendEmails_(b, ref, start, end); } catch (err) { console.error('Email failed: ' + err); }
  return json_({ ok: true, ref: ref });
}

// ---- helpers ---------------------------------------------------------------

function check_(b) {
  if (!b || b.action !== 'book') return 'bad_request';
  if (!isDate_(b.date)) return 'bad_date';
  if (!/^\d{2}:\d{2}$/.test(String(b.start))) return 'bad_time';
  var mins = Number(b.minutes);
  if (!(mins >= 10 && mins <= 300) || mins % 1) return 'bad_length';
  if (toMin_(b.start) + mins > 24 * 60) return 'bad_time';
  if (b.date < todayStr_()) return 'in_past';
  if (!b.name || String(b.name).trim().length < 2) return 'missing_name';
  if (!b.phone || String(b.phone).replace(/\D/g, '').length < 8) return 'missing_phone';
  if (!b.service) return 'missing_service';
  return '';
}

/** Every booked or blocked time between two dates (inclusive), as minutes from midnight. */
function taken_(from, to) {
  var sh = getSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var out = [];
  rows.forEach(function (r) {
    var status = String(r[COL.status]).trim().toLowerCase();
    if (status === 'cancelled' || status === 'canceled') return;
    var date = normDate_(r[COL.date], tz);
    if (!date || date < from || date > to) return;
    var s = normTime_(r[COL.start], tz), e = normTime_(r[COL.end], tz);
    if (s === null) { s = 0; e = 24 * 60; }                 // no start = whole day blocked
    else if (e === null || e <= s) e = s + 60;
    out.push({ date: date, start: s, end: e });
  });
  return out;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (sh) return sh;
  sh = ss.insertSheet(SHEET_NAME, 0);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  // Times, phone numbers and the rest stay exactly as typed (no auto-converting).
  sh.getRange('B:C').setNumberFormat('@');
  sh.getRange('E:G').setNumberFormat('@');
  sh.getRange('J:R').setNumberFormat('@');
  sh.getRange('A:A').setNumberFormat('d mmm yyyy h:mm');
  sh.getRange('D:D').setNumberFormat('ddd d mmm yyyy');
  return sh;
}

function sendEmails_(b, ref, start, end) {
  var when = prettyDate_(b.date) + ' at ' + prettyTime_(start) + ' to ' + prettyTime_(end);
  var owner = SETTINGS.notifyEmail || Session.getEffectiveUser().getEmail();

  if (owner) {
    var lines = [
      'New booking ' + ref,
      '',
      b.service + ' (' + b.minutes + ' min)',
      when,
      '',
      'Name: ' + b.name,
      'Phone: ' + b.phone,
      'Email: ' + (b.email || '-'),
      'First visit: ' + (b.firstVisit ? 'Yes' : 'No'),
      'Notes: ' + (b.notes || '-'),
      '',
      'Came from: ' + (b.source || 'direct') + (b.campaign ? ' / ' + b.campaign : '') + (b.ad ? ' / ' + b.ad : ''),
      '',
      'To cancel it, change its Status to Cancelled in the Bookings sheet.'
    ];
    var msg = { to: owner, subject: 'New booking: ' + b.name + ', ' + prettyDate_(b.date) + ' ' + prettyTime_(start), body: lines.join('\n') };
    if (isEmail_(b.email)) msg.replyTo = b.email;
    MailApp.sendEmail(msg);
  }

  if (SETTINGS.emailCustomers && isEmail_(b.email)) {
    var first = String(b.name).trim().split(/\s+/)[0];
    var reply = {
      to: b.email,
      name: SETTINGS.businessName,
      subject: 'You\'re booked: ' + b.service + ', ' + prettyDate_(b.date) + ' at ' + prettyTime_(start),
      body: [
        'Hi ' + first + ',',
        '',
        'Thanks for booking with ' + SETTINGS.businessName + '. See you soon!',
        '',
        b.service + ' (' + b.minutes + ' min)',
        when,
        SETTINGS.address,
        '',
        'Booking ref: ' + ref,
        '',
        SETTINGS.policy,
        'Need to change anything? Call us on ' + SETTINGS.phone + '.',
        '',
        SETTINGS.businessName
      ].join('\n')
    };
    if (owner) reply.replyTo = owner;
    MailApp.sendEmail(reply);
  }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function isDate_(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }
function isEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '')); }
function toMin_(t) { var p = String(t).split(':'); return Number(p[0]) * 60 + Number(p[1] || 0); }
function pad_(n) { return (n < 10 ? '0' : '') + n; }
function hhmm_(m) { return pad_(Math.floor(m / 60)) + ':' + pad_(m % 60); }
function todayStr_() { return Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd'); }

/** Stops typed text being treated as a formula, and keeps cells a sane size. */
function cell_(v) {
  v = v == null ? '' : String(v).slice(0, 1000);
  return /^[=+\-@]/.test(v) ? '\'' + v : v;
}

function newRef_() {
  var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 6; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return s;
}

/** Accepts a real date cell (however you typed it) or text like 2026-12-01. */
function normDate_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  var s = String(v || '').trim();
  return isDate_(s) ? s : '';
}

/** Accepts a real time cell or text like 13:00, 9:30, 1pm or 1:30 pm. Returns minutes, or null. */
function normTime_(v, tz) {
  if (v instanceof Date) return toMin_(Utilities.formatDate(v, tz, 'HH:mm'));
  var s = String(v || '').trim().toLowerCase();
  var m = s.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  var h = Number(m[1]), min = Number(m[2] || 0);
  if (m[3] === 'pm' && h < 12) h += 12;
  if (m[3] === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

function prettyDate_(d) {
  var p = d.split('-');
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
  return days[dt.getDay()] + ' ' + Number(p[2]) + ' ' + months[Number(p[1]) - 1];
}

function prettyTime_(m) {
  if (SETTINGS.clock24) return hhmm_(m);
  var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return h + (mm ? ':' + pad_(mm) : '') + ap;
}
