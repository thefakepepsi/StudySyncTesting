/* Accounts: login / sign-up against the StudySync server, plus activity tracking and a small modal helper.
   When SS_BACKEND.URL is empty, none of this is active and the site keeps its demo login. */
(function () {
  'use strict';
  var SS = window.SS, el = SS.el, t = SS.t, $ = SS.$;
  var BASE = String((window.SS_BACKEND && window.SS_BACKEND.URL) || '').replace(/\/+$/, '');
  var on = !!BASE;
  var TK = 'ss_token';

  var TX = {
    login_b: { en: 'Log in', hi: 'लॉग इन', zh: '登录', ar: 'تسجيل الدخول', ru: 'Войти', ml: 'ലോഗിൻ', te: 'లాగిన్', fr: 'Se connecter', es: 'Iniciar sesión', id: 'Masuk' },
    nav_class_track: { en: 'Class Tracking' }, nav_teacher_track: { en: 'Teacher Tracking' },
    nav_my_classes: { en: 'My Classes' }, nav_my_class: { en: 'My Class' }, nav_join_org: { en: 'Join an Organization' },
    role_learner: { en: 'Independent Learner' }, role_student: { en: 'Student' }, role_teacher: { en: 'Teacher' }, role_founder: { en: 'Founder' },
    au_login: { en: 'Log in' }, au_signup: { en: 'Create account' },
    au_have: { en: 'Already have an account? Log in' }, au_new: { en: 'New here? Create an account' },
    au_role: { en: 'I am a…' }, au_user: { en: 'Username' }, au_pass: { en: 'Password' }, au_name: { en: 'Display name (optional)' },
    au_terms: { en: 'I accept the Terms of Service and the' }, au_privacy: { en: 'Privacy Policy' },
    au_need_terms: { en: 'Please accept the Terms of Service and Privacy Policy.' },
    au_need_all: { en: 'Enter a username and password.' }, au_wait: { en: 'Please wait…' },
    au_down: { en: 'Could not reach the server. Check your connection and the server address in backend-config.js.' },
    au_hint_user: { en: '3 to 24 characters: letters, numbers, dots or underscores.' },
    au_hint_pass: { en: 'At least 6 characters.' },
    au_monitor: { en: 'You are in a class, so your teacher can see your AI tutor chats and which tools you use.' },
    au_logged: { en: 'Logged in.' }
  };
  Object.keys(TX).forEach(function (k) {
    Object.keys(window.I18N || {}).forEach(function (l) {
      var v = TX[k][l] || (l === 'en' ? TX[k].en : null);
      if (v && window.I18N[l]) window.I18N[l][k] = v;
    });
  });

  /* ---- Modal helper (also used by school.js and courses.js) ---- */
  SS.modal = function (title, cls) {
    var ov = el('div', 'overlay'); ov.hidden = true;
    var dlg = el('div', 'dialog' + (cls ? ' ' + cls : ''));
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    var head = el('div', 'd-head'), h = el('h2', null, title), x = el('button', 'x', '×');
    x.type = 'button'; x.setAttribute('aria-label', t('close'));
    head.appendChild(h); head.appendChild(x);
    var body = el('div', 'd-body');
    dlg.appendChild(head); dlg.appendChild(body); ov.appendChild(dlg); document.body.appendChild(ov);
    function close() { SS.closeM(ov); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 0); }
    x.addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    SS.openM(ov, document.activeElement);
    return { ov: ov, body: body, close: close };
  };

  /* ---- API ---- */
  function token() { return SS.LS.get(TK); }
  async function call(method, path, body) {
    var h = { 'Content-Type': 'application/json' };
    if (token()) h.Authorization = 'Bearer ' + token();
    var res;
    try { res = await fetch(BASE + path, { method: method, headers: h, body: body == null ? undefined : JSON.stringify(body) }); }
    catch (e) { var err = new Error(t('au_down')); err.network = true; throw err; }
    var data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      var er = new Error(data.error || ('Error ' + res.status)); er.status = res.status;
      if (res.status === 401 && token() && path !== '/api/login') { SS.LS.del(TK); SS.setUser(null); }
      throw er;
    }
    return data;
  }
  SS.api = { on: function () { return on && !!SS.user() && !!token(); }, enabled: on, base: BASE, call: call,
    get: function (p) { return call('GET', p); }, post: function (p, b) { return call('POST', p, b || {}); },
    put: function (p, b) { return call('PUT', p, b || {}); }, del: function (p) { return call('DELETE', p); } };
  if (!on) return;
  SS.backendOn = true;

  /* Relabel the header button: this is a username/password login now. */
  (function () {
    var lab = $('#loginLabel'); if (lab) { lab.setAttribute('data-i18n', 'login_b'); lab.textContent = t('login_b'); }
    var g = $('.g-mark'); if (g) g.hidden = true;
  })();
  SS.onLang(function () { var lab = $('#loginLabel'); if (lab) lab.textContent = t('login_b'); });

  /* ---- Login / sign-up dialog ---- */
  var ROLES = ['learner', 'student', 'teacher', 'founder'];
  function openLogin(opener) {
    var mode = 'login', role = 'learner';
    var m = SS.modal(t('au_login'));
    var body = m.body, h2 = $('h2', m.ov);
    var roleRow = el('div', 'au-roles'); roleRow.setAttribute('role', 'radiogroup'); roleRow.setAttribute('aria-label', t('au_role'));
    var roleBtns = ROLES.map(function (r) {
      var b = el('button', 'au-role', t('role_' + r)); b.type = 'button'; b.setAttribute('role', 'radio');
      b.addEventListener('click', function () { role = r; paintRoles(); });
      roleRow.appendChild(b); return b;
    });
    function paintRoles() { roleBtns.forEach(function (b, i) { b.setAttribute('aria-checked', String(ROLES[i] === role)); }); }
    paintRoles();
    var uI = document.createElement('input'); uI.type = 'text'; uI.autocomplete = 'username'; uI.maxLength = 24; uI.setAttribute('data-autofocus', ''); uI.autocapitalize = 'none'; uI.spellcheck = false;
    var pI = document.createElement('input'); pI.type = 'password'; pI.autocomplete = 'current-password'; pI.maxLength = 100;
    var nI = document.createElement('input'); nI.type = 'text'; nI.maxLength = 40;
    function fld(label, node, hint) { var f = el('label', 'field'); f.appendChild(el('span', null, label)); f.appendChild(node); if (hint) f.appendChild(el('span', 'hint', hint)); return f; }
    var nameF = fld(t('au_name'), nI);
    var tOk = document.createElement('input'); tOk.type = 'checkbox';
    var tLab = el('label', 'check'); tLab.appendChild(tOk);
    var tSpan = el('span', null, t('au_terms') + ' '); var pl = el('a', null, t('au_privacy')); pl.href = 'https://thefakepepsi.github.io/StudySyncPrivacyPolicy/'; pl.target = '_blank'; pl.rel = 'noopener'; tSpan.appendChild(pl); tLab.appendChild(tSpan);
    var err = el('p', 'status err'); err.setAttribute('role', 'alert');
    var go = el('button', 'btn', t('au_login')); go.type = 'button';
    var sw = el('button', 'linkbtn', t('au_new')); sw.type = 'button';
    var form = document.createElement('form'); form.noValidate = true;
    form.appendChild(el('div', 'sec-label', t('au_role'))); form.appendChild(roleRow);
    form.appendChild(fld(t('au_user'), uI)); form.appendChild(fld(t('au_pass'), pI)); form.appendChild(nameF); form.appendChild(tLab);
    form.appendChild(err); form.appendChild(go); form.appendChild(el('div', 'au-sw')).appendChild(sw);
    body.appendChild(form);
    function paint() {
      var s = mode === 'signup';
      nameF.hidden = !s; tLab.hidden = !s;
      h2.textContent = s ? t('au_signup') : t('au_login'); go.textContent = s ? t('au_signup') : t('au_login');
      sw.textContent = s ? t('au_have') : t('au_new'); pI.autocomplete = s ? 'new-password' : 'current-password'; err.textContent = '';
    }
    paint();
    sw.addEventListener('click', function () { mode = mode === 'login' ? 'signup' : 'login'; paint(); });
    var busy = false;
    async function submit() {
      if (busy) return;
      err.textContent = '';
      if (!uI.value.trim() || !pI.value) { err.textContent = t('au_need_all'); return; }
      if (mode === 'signup' && !tOk.checked) { err.textContent = t('au_need_terms'); return; }
      busy = true; go.disabled = true; var old = go.textContent; go.textContent = t('au_wait');
      try {
        var out = mode === 'signup'
          ? await call('POST', '/api/register', { username: uI.value, password: pI.value, role: role, displayName: nI.value })
          : await call('POST', '/api/login', { username: uI.value, password: pI.value, role: role });
        SS.LS.set(TK, out.token);
        if (mode === 'signup') { try { await call('POST', '/api/terms'); } catch (e) {} }
        SS.setUser(out.user); m.close(); SS.toast(out.monitored ? t('au_monitor') : t('au_logged'));
        startBeat();
      } catch (e) { err.textContent = e.message; go.textContent = old; }
      busy = false; go.disabled = false; if (go.textContent === t('au_wait')) paint();
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    go.addEventListener('click', submit);
  }
  SS.onLoginClick = function (btn) { openLogin(btn); return true; };
  SS.onLogout = function () { try { call('POST', '/api/logout'); } catch (e) {} SS.LS.del(TK); SS.LS.del('ss_user'); stopBeat(); };

  /* ---- Restore session on page load ---- */
  SS.LS.del('ss_user');
  SS.setUser(null);
  if (token()) {
    call('GET', '/api/me').then(function (r) {
      SS.setUser(r.user); startBeat();
      var h = (location.hash || '').replace('#', '');
      if (h) window.dispatchEvent(new Event('hashchange'));
    }).catch(function (e) { if (!e.network) SS.LS.del(TK); });
  }

  /* ---- Activity tracking ---- */
  var LABEL = { term: 'AI Terminal', voice: 'Voice Assistant', ledger: 'Ledger', career: 'Career Counselor', vr: 'VR Hub', courses: 'Courses', classes: 'Classes', teachers: 'Organizations' };
  var USAGE = { ledger: 'ledger', career: 'career', vr: 'vr', courses: 'courses', classes: 'classes' };
  var curLabel = '', curDetail = '', beat = null;
  function quiet(p) { if (token()) p.catch(function () {}); }
  function sendActivity() {
    if (!SS.user() || !token() || !curLabel) return;
    quiet(call('POST', '/api/activity', { view: curLabel, detail: curDetail }));
  }
  function startBeat() { stopBeat(); beat = setInterval(function () { if (!document.hidden) sendActivity(); }, 60000); }
  function stopBeat() { if (beat) clearInterval(beat); beat = null; }
  if (token()) startBeat();
  SS.track = function (tool, detail) {
    if (!SS.user() || !token()) return;
    if (detail != null) curDetail = detail;
    if (tool) quiet(call('POST', '/api/usage', { tool: tool }));
    sendActivity();
  };
  SS.onView(function (name) {
    if (!SS.user() || !token()) return;
    curLabel = LABEL[name] || name; curDetail = '';
    var u = SS.user();
    var tool = USAGE[name]; if (name === 'teachers') tool = u.role === 'teacher' ? 'join' : 'teachers';
    if (tool) quiet(call('POST', '/api/usage', { tool: tool }));
    sendActivity();
  });
  SS.onAuth(function (ok) { if (!ok) { curLabel = ''; curDetail = ''; } });

  /* Count AI use and (for students in a class) save the tutor conversation for their teacher. */
  if (SS.AI) {
    var KIND = { main: 'tutor', flash: 'flash', syllabus: 'syl', exam: 'exam', career: null };
    var DETAIL = { main: 'Chatting with the AI tutor', flash: 'Making flashcards', syllabus: 'Analyzing a syllabus', exam: 'Making a practice exam', career: 'Talking to Waypoint' };
    var orig = SS.AI.chat;
    SS.AI.chat = async function (kind, messages, o) {
      var reply = await orig.apply(SS.AI, arguments);
      try {
        var voice = kind === 'main' && SS.currentView() === 'voice';
        var tool = voice ? 'voice' : KIND[kind];
        if (tool) SS.track(tool, voice ? 'Talking to the Voice Assistant' : DETAIL[kind]);
        else if (DETAIL[kind]) SS.track(null, DETAIL[kind]);
        var u = SS.user();
        if (kind === 'main' && u && u.role === 'student' && reply && token()) {
          var last = null; for (var i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'user') { last = messages[i]; break; }
          if (last) quiet(call('POST', '/api/chatlog', { tool: voice ? 'voice' : 'tutor', messages: [{ role: 'user', content: String(last.content) }, { role: 'assistant', content: String(reply) }] }));
        }
      } catch (e) {}
      return reply;
    };
    var origJ = SS.AI.chatJSON;
    /* chatJSON calls the internal chat, so usage is not double counted here. */
    SS.AI.chatJSON = function (kind) { var p = origJ.apply(SS.AI, arguments); p.then(function () { var u = SS.user(); var tool = KIND[kind]; if (tool && u) SS.track(tool, DETAIL[kind]); }).catch(function () {}); return p; };
  }
})();
