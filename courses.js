/* Courses: hardcoded preset courses (edit PRESETS below) + a course builder. Your own courses are saved in this browser. */
(function () {
  'use strict';
  var SS = window.SS, el = SS.el, t = SS.t, $ = SS.$;

  /* Preset courses live in courses-data.js (window.SS_PRESETS), grouped by subject. */
  var PRESETS = window.SS_PRESETS || [];
  var SUBJECTS = [['physics', 'sub_phy'], ['biology', 'sub_bio'], ['chemistry', 'sub_chem']];

  /* ---- Strings ---- */
  var TX = {
    nav_courses: { en: 'Courses', hi: 'कोर्स', zh: '课程', ar: 'الدورات', ru: 'Курсы', ml: 'കോഴ്സുകൾ', te: 'కోర్సులు', fr: 'Cours', es: 'Cursos', id: 'Kursus' },
    co_h: { en: 'Courses' }, co_sub: { en: 'Browse the courses below or build your own.' },
    co_tab_lib: { en: 'Library' }, co_tab_new: { en: 'Create a course' },
    co_presets: { en: 'Featured courses' }, co_mine: { en: 'My courses' },
    co_soon: { en: 'Coming soon' }, co_empty_mine: { en: 'You have not created any courses yet.' },
    co_empty_course: { en: 'This course has no content yet.' },
    co_open: { en: 'Open' }, co_edit: { en: 'Edit' }, co_del: { en: 'Delete' }, co_back: { en: 'Back to courses' },
    co_del_q: { en: 'Delete this course? This cannot be undone.' },
    co_title: { en: 'Course title' }, co_title_ph: { en: 'e.g. Introduction to Fractions' },
    co_info: { en: 'Course information' }, co_info_ph: { en: 'What will learners get from this course?' },
    co_add: { en: 'Add to course' },
    co_b_text: { en: 'Text' }, co_b_video: { en: 'Video' }, co_b_image: { en: 'Image' },
    co_b_mcq: { en: 'Multiple choice' }, co_b_short: { en: 'Short answer' },
    co_text_ph: { en: 'Write some content…' },
    co_video_url: { en: 'Video link (YouTube, Vimeo, or a direct .mp4/.webm link)' },
    co_img_url: { en: 'Image link (https://…)' }, co_img_up: { en: 'or upload an image' }, co_caption: { en: 'Caption (optional)' },
    co_q: { en: 'Question' }, co_opt: { en: 'Option {n}' }, co_correct: { en: 'Correct answer' },
    co_add_opt: { en: 'Add option' }, co_rm_opt: { en: 'Remove option' },
    co_why: { en: 'Explanation (optional)' }, co_model: { en: 'Model answer' },
    co_up: { en: 'Move up' }, co_down: { en: 'Move down' }, co_rm: { en: 'Remove' },
    co_save: { en: 'Save course' }, co_cancel: { en: 'Cancel' },
    co_saved: { en: 'Course saved.' },
    co_err_title: { en: 'Give your course a title.' },
    co_err_block: { en: 'Fill in every block, or remove the empty ones.' },
    co_err_video: { en: 'That video link is not supported. Use YouTube, Vimeo, or a direct .mp4/.webm link.' },
    co_err_img: { en: 'Use an https:// image link or upload an image.' },
    co_err_mcq: { en: 'Each multiple choice needs a question and at least two filled options.' },
    co_err_full: { en: 'Your browser storage is full. Remove images or courses and try again.' },
    co_check: { en: 'Check answer' }, co_right: { en: 'Correct!' }, co_wrong: { en: 'Not quite.' },
    co_reveal: { en: 'Show model answer' }, co_yours: { en: 'Your answer' },
    co_score: { en: 'Score: {s} / {t}' }, co_no_blocks: { en: 'Add at least one block to your course.' },
    co_bad_img: { en: 'Could not read that image.' },
    co_assigned: { en: 'Assigned to you' }, co_assign: { en: 'Assign to classes' }, co_assign_none: { en: 'You have no classes yet. Ask the founder to assign you to a class first.' },
    co_assign_note: { en: 'Students in the selected classes will see this course in their Courses tab.' },
    co_assigned_ok: { en: 'Course assigned.' }, co_by: { en: 'by {name}' }, co_submit: { en: 'Submit answers' }, co_last: { en: 'Last score: {s} / {t}' },
    co_loading: { en: 'Loading…' }, co_n_classes: { en: 'Assigned to {n} classes' }
  };
  Object.keys(TX).forEach(function (k) {
    Object.keys(window.I18N || {}).forEach(function (l) {
      var v = TX[k][l] || (l === 'en' ? TX[k].en : null);
      if (v && window.I18N[l]) window.I18N[l][k] = v;
    });
  });

  /* ---- Storage ---- */
  var KEY = 'ss_courses';
  function load() { try { var a = JSON.parse(SS.LS.get(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---- URL helpers ---- */
  function parseVideo(u) {
    u = (u || '').trim(); var m, url;
    try { url = new URL(u); } catch (e) { return null; }
    if (url.protocol !== 'https:') return null;
    var h = url.hostname.replace(/^www\./, '');
    if (h === 'youtu.be') { m = url.pathname.slice(1).match(/^[\w-]{6,15}/); if (m) return { kind: 'frame', src: 'https://www.youtube-nocookie.com/embed/' + m[0] }; }
    if (h === 'youtube.com' || h === 'm.youtube.com') {
      var id = url.searchParams.get('v');
      if (!id) { m = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,15})/); id = m && m[1]; }
      if (id && /^[\w-]{6,15}$/.test(id)) return { kind: 'frame', src: 'https://www.youtube-nocookie.com/embed/' + id };
    }
    if (h === 'vimeo.com') { m = url.pathname.match(/^\/(\d+)/); if (m) return { kind: 'frame', src: 'https://player.vimeo.com/video/' + m[1] }; }
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return { kind: 'video', src: url.href };
    return null;
  }
  function okImg(u) {
    u = (u || '').trim();
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u)) return u;
    if (SS.api && SS.api.base && u.indexOf(SS.api.base + '/api/images/') === 0) return u;
    try { return new URL(u).protocol === 'https:' ? u : null; } catch (e) { return null; }
  }
  function online() { return !!(SS.api && SS.api.on && SS.api.on()); }
  function canAssign() { var u = SS.user(); return online() && u && (u.role === 'teacher' || u.role === 'founder'); }
  function fail(e) { SS.toast(e && e.message ? e.message : String(e)); }
  function resize(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var s = Math.min(1, 800 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.8));
      };
      im.onerror = function () { cb(null); };
      im.src = fr.result;
    };
    fr.onerror = function () { cb(null); };
    fr.readAsDataURL(file);
  }

  /* ---- State ---- */
  var root, listEl, panelLib, panelNew, tabs, playEl, mainEl;
  var editing = null;      // course being edited in the builder
  var draft = [];          // builder blocks

  function btn(cls, txt, fn) { var b = el('button', 'btn ' + cls, txt); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
  function field(label, node) { var f = el('label', 'field'); f.appendChild(el('span', null, label)); f.appendChild(node); return f; }
  function inp(val, ph, type) { var i = document.createElement('input'); i.type = type || 'text'; i.value = val || ''; if (ph) i.placeholder = ph; return i; }
  function ta(val, ph) { var a = document.createElement('textarea'); a.rows = 3; a.value = val || ''; if (ph) a.placeholder = ph; return a; }

  /* ---- Library ---- */
  function card(c, preset) {
    var d = el('div', 'co-card');
    d.tabIndex = 0; d.setAttribute('role', 'button');
    var ic = el('span', 'co-icon', (c.title || '?').trim().charAt(0).toUpperCase());
    d.appendChild(ic);
    d.appendChild(el('h3', null, c.title));
    var empty = !c.blocks || !c.blocks.length;
    d.appendChild(el('p', 'co-meta', c.info ? c.info : (empty && preset ? t('co_soon') : '')));
    if (c.owner) d.appendChild(el('p', 'co-meta', t('co_by', { name: c.owner })));
    if (c.score != null) d.appendChild(el('p', 'co-meta', t('co_last', { s: c.score, t: c.total })));
    if (c.remote && c.classIds && c.classIds.length) d.appendChild(el('p', 'co-meta', t('co_n_classes', { n: c.classIds.length })));
    var act = el('div', 'co-actions');
    if (!preset && !c.assigned) {
      act.appendChild(btn('ghost sm', t('co_edit'), function (e) { e.stopPropagation(); startEdit(c); }));
      if (c.remote && canAssign()) act.appendChild(btn('ghost sm', t('co_assign'), function (e) { e.stopPropagation(); assignDialog(c); }));
      act.appendChild(btn('ghost sm', t('co_del'), async function (e) {
        e.stopPropagation();
        if (!confirm(t('co_del_q'))) return;
        if (c.remote) { try { await SS.api.del('/api/courses/' + c.id); } catch (er) { return fail(er); } }
        else save(load().filter(function (x) { return x.id !== c.id; }));
        renderLib();
      }));
    }
    d.appendChild(act);
    function open() { if (c.remote) playRemote(c.id); else play(c); }
    d.addEventListener('click', open);
    d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    return d;
  }
  function renderLib() {
    listEl.textContent = '';
    SUBJECTS.forEach(function (sj) {
      var items = PRESETS.filter(function (c) { return c.subject === sj[0]; });
      if (!items.length) return;
      listEl.appendChild(el('h2', 'co-subj', t(sj[1])));
      var g = el('div', 'co-grid');
      items.forEach(function (c) { g.appendChild(card(c, true)); });
      listEl.appendChild(g);
    });
    listEl.appendChild(el('h2', null, t('co_mine')));
    var host = el('div'); listEl.appendChild(host);
    function fill(h, arr, emptyMsg) {
      if (!arr.length) { if (emptyMsg) h.appendChild(el('p', 'hint', emptyMsg)); return; }
      var g2 = el('div', 'co-grid'); arr.forEach(function (c) { g2.appendChild(card(c, false)); }); h.appendChild(g2);
    }
    if (!online()) { fill(host, load(), t('co_empty_mine')); return; }
    host.appendChild(el('p', 'hint', t('co_loading')));
    SS.api.get('/api/courses').then(function (d) {
      host.textContent = '';
      fill(host, d.mine.map(function (c) { c.remote = true; return c; }), t('co_empty_mine'));
      if (d.assigned.length) {
        host.appendChild(el('h2', null, t('co_assigned')));
        fill(host, d.assigned.map(function (c) { c.remote = true; c.assigned = true; return c; }));
      }
    }).catch(function (e) { host.textContent = ''; host.appendChild(el('p', 'status err', e.message)); });
  }

  async function assignDialog(c) {
    var m = SS.modal(t('co_assign'));
    try {
      var cl = (await SS.api.get('/api/classes')).classes;
      if (!cl.length) { m.body.appendChild(el('p', 'hint', t('co_assign_none'))); return; }
      m.body.appendChild(el('p', 'hint', t('co_assign_note')));
      var picks = [];
      cl.forEach(function (k) {
        var lab = el('label', 'check'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = (c.classIds || []).indexOf(k.id) >= 0; cb.value = k.id;
        lab.appendChild(cb); lab.appendChild(el('span', null, k.name + ' · ' + k.org_name)); m.body.appendChild(lab); picks.push(cb);
      });
      var go = btn('', t('co_save'), async function () {
        go.disabled = true;
        try { var r = await SS.api.put('/api/courses/' + c.id + '/classes', { classIds: picks.filter(function (x) { return x.checked; }).map(function (x) { return x.value; }) }); c.classIds = r.classIds; SS.toast(t('co_assigned_ok')); m.close(); renderLib(); }
        catch (e) { fail(e); go.disabled = false; }
      });
      m.body.appendChild(go);
    } catch (e) { m.body.appendChild(el('p', 'status err', e.message)); }
  }

  /* Server courses: answers are graded by the server and saved for the teacher. */
  async function playRemote(id) {
    mainEl.hidden = true; playEl.hidden = false; playEl.textContent = '';
    playEl.appendChild(btn('ghost', t('co_back'), function () { playEl.hidden = true; mainEl.hidden = false; renderLib(); }));
    var wait = el('p', 'hint', t('co_loading')); playEl.appendChild(wait);
    var c;
    try { c = (await SS.api.get('/api/courses/' + id)).course; } catch (e) { wait.textContent = e.message; wait.className = 'status err'; return; }
    wait.remove();
    SS.track && SS.track('courses', 'Course: ' + c.title);
    playEl.appendChild(el('h2', 'co-ptitle', c.title));
    if (c.info) playEl.appendChild(el('p', 'co-pinfo', c.info));
    if (!c.blocks.length) { playEl.appendChild(el('p', 'hint', t('co_empty_course'))); return; }
    var inputs = {}, fbs = {}, hasQ = false;
    c.blocks.forEach(function (b) {
      var s = el('section', 'co-block');
      if (b.type === 'mcq' || b.type === 'short') hasQ = true;
      if (b.type === 'text') String(b.text || '').split(/\n{2,}/).forEach(function (p) { s.appendChild(el('p', null, p)); });
      else if (b.type === 'video') {
        var v = parseVideo(b.url);
        if (v && v.kind === 'frame') { var f = document.createElement('iframe'); f.src = v.src; f.allowFullscreen = true; f.loading = 'lazy'; f.setAttribute('allow', 'accelerometer; encrypted-media; picture-in-picture'); f.referrerPolicy = 'strict-origin-when-cross-origin'; f.className = 'co-video'; s.appendChild(f); }
        else if (v) { var vd = document.createElement('video'); vd.src = v.src; vd.controls = true; vd.className = 'co-video'; s.appendChild(vd); }
      } else if (b.type === 'image') {
        var u = okImg(b.url);
        if (u) { var im = document.createElement('img'); im.src = u; im.alt = b.caption || ''; im.className = 'co-img'; im.referrerPolicy = 'no-referrer'; s.appendChild(im); }
        if (b.caption) s.appendChild(el('p', 'hint', b.caption));
      } else if (b.type === 'mcq') {
        s.appendChild(el('p', 'co-q', b.q));
        var name = uid(), opts = el('div', 'co-opts'), rs = [];
        b.options.forEach(function (o, i) { var l = el('label', 'check'), r = document.createElement('input'); r.type = 'radio'; r.name = name; r.value = i; l.appendChild(r); l.appendChild(el('span', null, o)); opts.appendChild(l); rs.push([r, l]); });
        s.appendChild(opts); inputs[b.id] = function () { var p = rs.filter(function (x) { return x[0].checked; })[0]; return p ? +p[0].value : -1; };
        fbs[b.id] = { rs: rs, box: s };
      } else if (b.type === 'short') {
        s.appendChild(el('p', 'co-q', b.q)); var a = ta('', t('co_yours')); s.appendChild(a); inputs[b.id] = function () { return a.value; }; fbs[b.id] = { box: s };
      }
      playEl.appendChild(s);
    });
    if (!hasQ) return;
    var scoreEl = el('p', 'co-score');
    var go = btn('', t('co_submit'), async function () {
      var answers = {}; Object.keys(inputs).forEach(function (k) { answers[k] = inputs[k](); });
      go.disabled = true;
      try {
        var r = await SS.api.post('/api/courses/' + id + '/attempt', { answers: answers });
        Object.keys(r.results).forEach(function (k) {
          var res = r.results[k], f = fbs[k]; if (!f) return;
          var old = f.box.querySelector('.co-fb'); if (old) old.remove();
          var fb = el('div', 'co-fb ' + (res.model != null ? 'ok' : (res.correct ? 'ok' : 'bad')));
          if (res.model != null) { fb.appendChild(el('strong', null, t('co_model') + ': ')); fb.appendChild(el('span', null, res.model)); }
          else { fb.appendChild(el('strong', null, res.correct ? t('co_right') : t('co_wrong'))); if (res.explain) fb.appendChild(el('span', null, ' ' + res.explain)); if (f.rs) f.rs.forEach(function (x, i) { x[1].classList.toggle('co-right', i === res.answer); }); }
          f.box.appendChild(fb);
        });
        scoreEl.textContent = t('co_score', { s: r.score, t: r.total });
      } catch (e) { fail(e); }
      go.disabled = false;
    });
    playEl.appendChild(go); playEl.appendChild(scoreEl);
  }

  /* ---- Player ---- */
  function play(c) {
    mainEl.hidden = true; playEl.hidden = false; playEl.textContent = '';
    playEl.appendChild(btn('ghost', t('co_back'), function () { playEl.hidden = true; mainEl.hidden = false; window.scrollTo(0, 0); }));
    playEl.appendChild(el('h2', 'co-ptitle', c.title));
    if (c.info) playEl.appendChild(el('p', 'co-pinfo', c.info));
    if (!c.blocks || !c.blocks.length) { playEl.appendChild(el('p', 'hint', t('co_empty_course'))); return; }
    var mcqs = [], done = 0, scoreEl = el('p', 'co-score'), score = 0;
    c.blocks.forEach(function (b) {
      var s = el('section', 'co-block');
      if (b.type === 'text') { String(b.text || '').split(/\n{2,}/).forEach(function (p) { s.appendChild(el('p', null, p)); }); }
      else if (b.type === 'video') {
        var v = parseVideo(b.url);
        if (v && v.kind === 'frame') {
          var f = document.createElement('iframe'); f.src = v.src; f.allowFullscreen = true; f.loading = 'lazy';
          f.setAttribute('allow', 'accelerometer; encrypted-media; picture-in-picture'); f.referrerPolicy = 'strict-origin-when-cross-origin';
          f.className = 'co-video'; s.appendChild(f);
        } else if (v) { var vd = document.createElement('video'); vd.src = v.src; vd.controls = true; vd.className = 'co-video'; s.appendChild(vd); }
      } else if (b.type === 'image') {
        var u = okImg(b.url);
        if (u) { var im = document.createElement('img'); im.src = u; im.alt = b.caption || ''; im.className = 'co-img'; im.referrerPolicy = 'no-referrer'; s.appendChild(im); }
        if (b.caption) s.appendChild(el('p', 'hint', b.caption));
      } else if (b.type === 'mcq') {
        s.appendChild(el('p', 'co-q', b.q));
        var name = uid(), opts = el('div', 'co-opts'), radios = [];
        (b.options || []).forEach(function (o, i) {
          var l = el('label', 'check'), r = document.createElement('input');
          r.type = 'radio'; r.name = name; r.value = i; l.appendChild(r); l.appendChild(el('span', null, o)); opts.appendChild(l); radios.push([r, l]);
        });
        s.appendChild(opts);
        var fb = el('div', 'co-fb'), go = btn('', t('co_check'), null), solved = false;
        go.addEventListener('click', function () {
          var pick = radios.filter(function (x) { return x[0].checked; })[0];
          if (!pick) return;
          var ok = +pick[0].value === b.answer;
          fb.textContent = ''; fb.className = 'co-fb ' + (ok ? 'ok' : 'bad');
          fb.appendChild(el('strong', null, ok ? t('co_right') : t('co_wrong')));
          if (b.why) fb.appendChild(el('span', null, ' ' + b.why));
          if (!solved) { solved = true; if (ok) score++; done++; scoreEl.textContent = t('co_score', { s: score, t: mcqs.length }); }
          radios.forEach(function (x) { x[0].disabled = true; if (+x[0].value === b.answer) x[1].classList.add('co-right'); });
          go.disabled = true;
        });
        s.appendChild(go); s.appendChild(fb); mcqs.push(b);
      } else if (b.type === 'short') {
        s.appendChild(el('p', 'co-q', b.q));
        var a = ta('', t('co_yours')); s.appendChild(a);
        var ans = el('div', 'co-fb ok'); ans.hidden = true;
        ans.appendChild(el('strong', null, t('co_model') + ': ')); ans.appendChild(el('span', null, b.model || ''));
        s.appendChild(btn('', t('co_reveal'), function () { ans.hidden = false; }));
        s.appendChild(ans);
      }
      playEl.appendChild(s);
    });
    if (mcqs.length) { scoreEl.textContent = t('co_score', { s: 0, t: mcqs.length }); playEl.appendChild(scoreEl); }
    window.scrollTo(0, 0);
  }

  /* ---- Builder ---- */
  var blocksEl, titleI, infoT;
  function blankBlock(type) {
    if (type === 'mcq') return { type: type, q: '', options: ['', ''], answer: 0, why: '' };
    if (type === 'short') return { type: type, q: '', model: '' };
    if (type === 'image') return { type: type, url: '', caption: '' };
    if (type === 'video') return { type: type, url: '' };
    return { type: 'text', text: '' };
  }
  function renderBlocks() {
    blocksEl.textContent = '';
    draft.forEach(function (b, i) {
      var w = el('div', 'co-edit');
      var head = el('div', 'co-edit-h');
      head.appendChild(el('strong', null, t('co_b_' + b.type)));
      var ctr = el('span', 'co-ctr');
      var up = btn('ghost sm', '↑', function () { if (i > 0) { draft.splice(i - 1, 0, draft.splice(i, 1)[0]); renderBlocks(); } });
      var dn = btn('ghost sm', '↓', function () { if (i < draft.length - 1) { draft.splice(i + 1, 0, draft.splice(i, 1)[0]); renderBlocks(); } });
      var rm = btn('ghost sm', '✕', function () { draft.splice(i, 1); renderBlocks(); });
      up.title = t('co_up'); up.setAttribute('aria-label', t('co_up')); dn.title = t('co_down'); dn.setAttribute('aria-label', t('co_down')); rm.title = t('co_rm'); rm.setAttribute('aria-label', t('co_rm'));
      ctr.appendChild(up); ctr.appendChild(dn); ctr.appendChild(rm); head.appendChild(ctr); w.appendChild(head);

      if (b.type === 'text') {
        var x = ta(b.text, t('co_text_ph')); x.rows = 5; x.addEventListener('input', function () { b.text = x.value; }); w.appendChild(x);
      } else if (b.type === 'video') {
        var vi = inp(b.url, 'https://'); vi.addEventListener('input', function () { b.url = vi.value; }); w.appendChild(field(t('co_video_url'), vi));
      } else if (b.type === 'image') {
        var ii = inp((b.url.indexOf('data:') === 0 || b.url.indexOf('/api/images/') > 0) ? '' : b.url, 'https://'); ii.addEventListener('input', function () { b.url = ii.value; });
        w.appendChild(field(t('co_img_url'), ii));
        var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*';
        var pv = document.createElement('img'); pv.className = 'co-img'; pv.hidden = true; pv.alt = '';
        if (b.url.indexOf('data:') === 0 || b.url.indexOf('/api/images/') > 0) { pv.src = b.url; pv.hidden = false; }
        fi.addEventListener('change', function () {
          if (!fi.files[0]) return;
          resize(fi.files[0], async function (d) {
            if (!d) return SS.toast(t('co_bad_img'));
            if (online()) {
              try { var up = await SS.api.post('/api/images', { mime: 'image/jpeg', data: d.split(',')[1] }); d = SS.api.base + up.url; }
              catch (e) { return fail(e); }
            }
            b.url = d; ii.value = ''; pv.src = d; pv.hidden = false;
          });
        });
        w.appendChild(field(t('co_img_up'), fi)); w.appendChild(pv);
        var ci = inp(b.caption); ci.addEventListener('input', function () { b.caption = ci.value; }); w.appendChild(field(t('co_caption'), ci));
      } else if (b.type === 'mcq') {
        var q = ta(b.q, t('co_q')); q.rows = 2; q.addEventListener('input', function () { b.q = q.value; }); w.appendChild(field(t('co_q'), q));
        b.options.forEach(function (o, k) {
          var r = el('div', 'co-optrow'), rd = document.createElement('input');
          rd.type = 'radio'; rd.name = 'ans' + i; rd.checked = b.answer === k; rd.title = t('co_correct'); rd.setAttribute('aria-label', t('co_correct'));
          rd.addEventListener('change', function () { b.answer = k; });
          var oi = inp(o, t('co_opt', { n: k + 1 })); oi.addEventListener('input', function () { b.options[k] = oi.value; });
          r.appendChild(rd); r.appendChild(oi);
          if (b.options.length > 2) r.appendChild(btn('ghost sm', '−', function () { b.options.splice(k, 1); if (b.answer >= b.options.length) b.answer = 0; else if (b.answer > k) b.answer--; renderBlocks(); }));
          w.appendChild(r);
        });
        if (b.options.length < 6) w.appendChild(btn('ghost sm', '+ ' + t('co_add_opt'), function () { b.options.push(''); renderBlocks(); }));
        var wy = inp(b.why); wy.addEventListener('input', function () { b.why = wy.value; }); w.appendChild(field(t('co_why'), wy));
      } else if (b.type === 'short') {
        var sq = ta(b.q, t('co_q')); sq.rows = 2; sq.addEventListener('input', function () { b.q = sq.value; }); w.appendChild(field(t('co_q'), sq));
        var sm = ta(b.model); sm.addEventListener('input', function () { b.model = sm.value; }); w.appendChild(field(t('co_model'), sm));
      }
      blocksEl.appendChild(w);
    });
  }
  async function startEdit(c) {
    if (c && c.remote) {
      try {
        var full = (await SS.api.get('/api/courses/' + c.id)).course;
        full.blocks.forEach(function (b) { if (b.type === 'mcq') b.why = b.explain || ''; });
        c = { id: full.id, remote: true, title: full.title, info: full.info, blocks: full.blocks };
      } catch (e) { return fail(e); }
    }
    editing = c || null;
    draft = c ? JSON.parse(JSON.stringify(c.blocks)) : [];
    titleI.value = c ? c.title : ''; infoT.value = c ? c.info : '';
    renderBlocks(); selectTab('new'); playEl.hidden = true; mainEl.hidden = false;
  }
  function validate() {
    var title = titleI.value.trim();
    if (!title) return t('co_err_title');
    if (!draft.length) return t('co_no_blocks');
    for (var i = 0; i < draft.length; i++) {
      var b = draft[i];
      if (b.type === 'text' && !b.text.trim()) return t('co_err_block');
      if (b.type === 'video') { if (!b.url.trim()) return t('co_err_block'); if (!parseVideo(b.url)) return t('co_err_video'); }
      if (b.type === 'image') { if (!b.url.trim()) return t('co_err_block'); if (!okImg(b.url)) return t('co_err_img'); }
      if (b.type === 'short' && (!b.q.trim() || !b.model.trim())) return t('co_err_block');
      if (b.type === 'mcq') { if (!b.q.trim() || b.options.filter(function (o) { return o.trim(); }).length < 2 || !b.options[b.answer].trim()) return t('co_err_mcq'); }
    }
    return null;
  }
  function doSave() {
    var err = validate(); if (err) return SS.toast(err);
    var blocks = JSON.parse(JSON.stringify(draft));
    blocks.forEach(function (b) {
      if (b.type === 'mcq') {
        var keep = [], ans = 0; b.options.forEach(function (o, k) { if (o.trim()) { if (k === b.answer) ans = keep.length; keep.push(o.trim()); } }); b.options = keep; b.answer = ans;
      }
    });
    if (online()) {
      blocks.forEach(function (b) { if (b.type === 'mcq') { b.explain = b.why || ''; delete b.why; } });
      var payload = { title: titleI.value.trim(), info: infoT.value.trim(), blocks: blocks };
      var req = editing && editing.remote ? SS.api.put('/api/courses/' + editing.id, payload) : SS.api.post('/api/courses', payload);
      return req.then(function () {
        SS.toast(t('co_saved')); editing = null; draft = []; titleI.value = ''; infoT.value = ''; renderBlocks(); renderLib(); selectTab('lib');
      }).catch(fail);
    }
    var c = { id: editing ? editing.id : uid(), title: titleI.value.trim(), info: infoT.value.trim(), blocks: blocks };
    var list = load(), idx = -1; list.forEach(function (x, i) { if (x.id === c.id) idx = i; });
    if (idx >= 0) list[idx] = c; else list.push(c);
    if (!save(list)) return SS.toast(t('co_err_full'));
    SS.toast(t('co_saved')); editing = null; draft = []; titleI.value = ''; infoT.value = ''; renderBlocks(); renderLib(); selectTab('lib');
  }

  function selectTab(n) {
    panelLib.hidden = n !== 'lib'; panelNew.hidden = n !== 'new';
    SS.$$('.tab', tabs).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-t') === n ? 'true' : 'false'); });
  }

  function build(r) {
      root = r;
      r.innerHTML =
        '<div class="wrap tool-page courses">' +
        '<div class="term-head"><h1 data-i18n="co_h"></h1><p class="sub" data-i18n="co_sub"></p></div>' +
        '<div id="coMain"><div class="tabs" role="tablist" id="coTabs">' +
        '<button class="tab" role="tab" type="button" data-t="lib" aria-selected="true" data-i18n="co_tab_lib"></button>' +
        '<button class="tab" role="tab" type="button" data-t="new" aria-selected="false" data-i18n="co_tab_new"></button></div>' +
        '<div class="panel" id="coLib"><div id="coList"></div></div>' +
        '<div class="panel" id="coNew" hidden></div></div>' +
        '<div id="coPlay" hidden></div></div>';
      mainEl = $('#coMain', r); playEl = $('#coPlay', r); listEl = $('#coList', r); panelLib = $('#coLib', r); panelNew = $('#coNew', r); tabs = $('#coTabs', r);
      SS.$$('.tab', tabs).forEach(function (b) { b.addEventListener('click', function () { if (b.getAttribute('data-t') === 'new' && !editing) { draft = []; titleI.value = ''; infoT.value = ''; renderBlocks(); } selectTab(b.getAttribute('data-t')); }); });

      titleI = inp('', t('co_title_ph')); titleI.maxLength = 120;
      infoT = ta('', t('co_info_ph')); infoT.rows = 4;
      var form = el('div', 'tool-form');
      form.appendChild(field(t('co_title'), titleI)); form.appendChild(field(t('co_info'), infoT));
      blocksEl = el('div', 'co-blocks'); form.appendChild(blocksEl);
      var adds = el('div', 'co-adds'); adds.appendChild(el('strong', null, t('co_add') + ':'));
      ['text', 'video', 'image', 'mcq', 'short'].forEach(function (ty) { adds.appendChild(btn('ghost sm', '+ ' + t('co_b_' + ty), function () { draft.push(blankBlock(ty)); renderBlocks(); })); });
      form.appendChild(adds);
      var bar = el('div', 'co-actions');
      bar.appendChild(btn('', t('co_save'), doSave));
      bar.appendChild(btn('ghost', t('co_cancel'), function () { editing = null; draft = []; titleI.value = ''; infoT.value = ''; renderBlocks(); selectTab('lib'); }));
      form.appendChild(bar);
      panelNew.appendChild(form);
      renderBlocks(); renderLib(); SS.applyI18n(r);
  }
  SS.registerView('courses', {
    init: function (r) { build(r); },
    onShow: function () { if (playEl) { playEl.hidden = true; mainEl.hidden = false; renderLib(); } }
  });
  SS.onAuth(function () { if (root) { editing = null; draft = []; build(root); } });

  SS.onLang(function () { if (root) { editing = null; draft = []; build(root); } });
})();
