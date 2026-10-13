/* Organizations, classes and tracking (needs the StudySync server). Founder: Class Tracking + Teacher Tracking.
   Teacher: My Classes + Join an Organization. Student: My Class. */
(function () {
  'use strict';
  var SS = window.SS, el = SS.el, t = SS.t, $ = SS.$;
  if (!SS.api || !SS.api.enabled) return;
  var api = SS.api;

  var TX = {
    co_org_create: 'Create an Organization', co_org_name: 'Name of Organization', co_org_private: 'Private', co_org_public: 'Public',
    co_org_private_s: 'Only you can invite teachers and request for them to join.', co_org_public_s: 'Anybody can request to join your organization.',
    sc_org_need: 'Enter a name for the organization.', sc_org_made: 'Organization created.',
    sc_make_class: 'Create a class', sc_class_name: 'Class name', sc_class_org: 'Organization', sc_class_made: 'Class created.',
    sc_no_classes: 'Create a Class, there are currently no classes.', sc_need_org: 'Create an organization first, then add classes to it.',
    sc_no_classes_t: 'No classes yet. Join an organization and ask its founder to assign you to a class.',
    sc_students: '{n} students', sc_student1: '1 student', sc_teachers_l: 'Teachers', sc_none: 'None',
    sc_back: 'Back', sc_code: 'Class code', sc_code_note: 'Students enter this code in "My Class" to join.', sc_copy: 'Copy', sc_copied: 'Copied.',
    sc_no_students: 'No students!', sc_online: 'Online now', sc_seen: 'Last seen {x}', sc_never: 'Not seen yet', sc_doing: 'Currently', sc_idle: 'Nothing yet',
    sc_tutor_msgs: 'AI tutor messages: {n}', sc_tools: 'Tool usage', sc_scores: 'Course scores', sc_chats: 'Chat history', sc_no_chats: 'No tutor chats yet.',
    sc_del_class: 'Delete class', sc_del_class_q: 'Delete this class? Students are removed from it.', sc_deleted: 'Class deleted.',
    sc_ago_s: 'just now', sc_ago_m: '{n} min ago', sc_ago_h: '{n} h ago', sc_ago_d: '{n} d ago',
    sc_you: 'Student', sc_ai: 'AI tutor',
    sc_join_code: 'Class code', sc_join: 'Join class', sc_leave: 'Leave', sc_joined: 'You joined {name}.', sc_left: 'You left the class.',
    sc_monitor: 'While you are in a class, your teacher can see your AI tutor chats and which tools you use.',
    sc_my_none: 'You are not in a class yet. Ask your teacher for a class code.',
    tt_no_orgs: 'Create an organization first to start assigning teachers.', tt_no_teachers: 'No teachers in this organization yet.',
    tt_invite: 'Invite a teacher', tt_username: 'Teacher username', tt_invited: 'Invitation sent.', tt_added: 'Teacher added.',
    tt_requests: 'Requests to join', tt_accept: 'Accept', tt_decline: 'Decline', tt_invites: 'Invited (waiting for a reply)',
    tt_remove: 'Remove', tt_assign: 'Assigned to classes', tt_no_cls: 'No classes in this organization yet.', tt_classes_n: '{n} classes',
    tt_using: 'Tools used', tt_visibility_private: 'Private', tt_visibility_public: 'Public',
    jo_invites: 'Invitations', jo_mine: 'My organizations', jo_find: 'Find a public organization', jo_search: 'Search by name',
    jo_request: 'Request to join', jo_requested: 'Request sent.', jo_pending: 'Waiting for approval', jo_active: 'Member', jo_none: 'No organizations match.',
    jo_none_mine: 'You have not joined any organization yet.', jo_by: 'by {name}', jo_leave: 'Leave', jo_accept: 'Accept', jo_decline: 'Decline', jo_private_note: 'Private organizations can only be joined by invitation from their founder.'
  };
  Object.keys(TX).forEach(function (k) { Object.keys(window.I18N || {}).forEach(function (l) { if (window.I18N[l]) window.I18N[l][k] = TX[k]; }); });

  function role() { var u = SS.user(); return u ? u.role : ''; }
  function ago(ts, now) {
    var s = Math.max(0, Math.round(((now || Date.now()) - ts) / 1000));
    if (s < 60) return t('sc_ago_s'); if (s < 3600) return t('sc_ago_m', { n: Math.round(s / 60) });
    if (s < 86400) return t('sc_ago_h', { n: Math.round(s / 3600) }); return t('sc_ago_d', { n: Math.round(s / 86400) });
  }
  function btn(cls, txt, fn) { var b = el('button', 'btn ' + (cls || ''), txt); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
  function icon(name) { return el('span', 'co-icon', (name || '?').trim().charAt(0).toUpperCase()); }
  function fail(e) { SS.toast(e && e.message ? e.message : String(e)); }
  function inp(ph, max) { var i = document.createElement('input'); i.type = 'text'; if (ph) i.placeholder = ph; if (max) i.maxLength = max; return i; }
  function field(label, node) { var f = el('label', 'field'); f.appendChild(el('span', null, label)); f.appendChild(node); return f; }

  /* ---------- Create an Organization ---------- */
  function createOrg(done) {
    var m = SS.modal(t('co_org_create'));
    var row = el('div', 'sc-orgname'); var ic = icon('?'); var nameI = inp('', 60); nameI.setAttribute('data-autofocus', '');
    nameI.addEventListener('input', function () { ic.textContent = (nameI.value.trim().charAt(0) || '?').toUpperCase(); });
    var f = field(t('co_org_name'), nameI); f.style.flex = '1';
    row.appendChild(ic); row.appendChild(f); m.body.appendChild(row);
    var opts = el('div', 'sc-vis');
    ['private', 'public'].forEach(function (v) {
      var box = el('div', 'sc-visbox');
      var b = btn(v === 'private' ? 'ghost' : '', t('co_org_' + v));
      box.appendChild(b); box.appendChild(el('p', 'hint', t('co_org_' + v + '_s')));
      b.addEventListener('click', async function () {
        var name = nameI.value.trim();
        if (name.length < 2) { SS.toast(t('sc_org_need')); nameI.focus(); return; }
        b.disabled = true;
        try { await api.post('/api/orgs', { name: name, visibility: v }); m.close(); SS.toast(t('sc_org_made')); if (done) done(); }
        catch (e) { fail(e); b.disabled = false; }
      });
      opts.appendChild(box);
    });
    m.body.appendChild(opts);
  }

  /* ---------- Create a class (founder) ---------- */
  function createClass(orgs, done) {
    var m = SS.modal(t('sc_make_class'));
    var sel = document.createElement('select');
    orgs.forEach(function (o) { var op = el('option', null, o.name); op.value = o.id; sel.appendChild(op); });
    var nameI = inp('', 60); nameI.setAttribute('data-autofocus', '');
    m.body.appendChild(field(t('sc_class_org'), sel)); m.body.appendChild(field(t('sc_class_name'), nameI));
    var go = btn('', t('sc_make_class'), async function () {
      if (nameI.value.trim().length < 2) { nameI.focus(); return; }
      go.disabled = true;
      try { await api.post('/api/classes', { orgId: sel.value, name: nameI.value.trim() }); m.close(); SS.toast(t('sc_class_made')); if (done) done(); }
      catch (e) { fail(e); go.disabled = false; }
    });
    m.body.appendChild(go);
  }

  /* ---------- Classes view ---------- */
  var cRoot, cBody, cTimer = null, openClass = null;
  function stopTimer() { if (cTimer) clearInterval(cTimer); cTimer = null; }

  async function renderClasses() {
    if (!cBody) return;
    stopTimer(); openClass = null;
    cBody.textContent = '';
    var r = role();
    var bar = el('div', 'sc-bar');
    if (r === 'founder') bar.appendChild(btn('', t('co_org_create'), function () { createOrg(renderClasses); }));
    cBody.appendChild(bar);
    try {
      if (r === 'student') return await renderStudent();
      var orgs = [];
      if (r === 'founder') {
        orgs = (await api.get('/api/orgs/mine')).orgs;
        var chips = el('div', 'sc-orgs');
        orgs.forEach(function (o) { var c = el('span', 'sc-orgchip'); c.appendChild(icon(o.name)); c.appendChild(el('span', null, o.name)); c.appendChild(el('small', null, t('tt_visibility_' + o.visibility))); chips.appendChild(c); });
        cBody.appendChild(chips);
        if (orgs.length) bar.appendChild(btn('ghost', t('sc_make_class'), function () { createClass(orgs, renderClasses); }));
      }
      var cl = (await api.get('/api/classes')).classes;
      if (!cl.length) {
        var e0 = el('div', 'sc-empty');
        e0.appendChild(el('p', null, r === 'founder' ? t('sc_no_classes') : t('sc_no_classes_t')));
        if (r === 'founder' && !orgs.length) e0.appendChild(el('p', 'hint', t('sc_need_org')));
        if (r === 'founder' && orgs.length) e0.appendChild(btn('', t('sc_make_class'), function () { createClass(orgs, renderClasses); }));
        cBody.appendChild(e0); return;
      }
      var g = el('div', 'co-grid');
      cl.forEach(function (c) {
        var d = el('div', 'co-card'); d.tabIndex = 0; d.setAttribute('role', 'button');
        d.appendChild(icon(c.name)); d.appendChild(el('h3', null, c.name)); d.appendChild(el('p', 'co-meta', c.org_name));
        d.appendChild(el('p', 'co-meta', c.students === 1 ? t('sc_student1') : t('sc_students', { n: c.students })));
        if (r === 'founder') d.appendChild(el('p', 'co-meta', t('sc_teachers_l') + ': ' + (c.teachers || t('sc_none'))));
        function open() { showClass(c.id); }
        d.addEventListener('click', open); d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        g.appendChild(d);
      });
      cBody.appendChild(g);
    } catch (e) { cBody.appendChild(el('p', 'status err', e.message)); }
  }

  async function renderStudent() {
    cBody.appendChild(el('p', 'sub', t('sc_monitor')));
    var f = el('div', 'sc-join'); var ci = inp(t('sc_join_code'), 12); ci.style.textTransform = 'uppercase';
    var go = btn('', t('sc_join'), async function () {
      if (!ci.value.trim()) return; go.disabled = true;
      try { var r = await api.post('/api/classes/join', { code: ci.value }); SS.toast(t('sc_joined', { name: r.class.name })); renderClasses(); }
      catch (e) { fail(e); go.disabled = false; }
    });
    ci.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    f.appendChild(ci); f.appendChild(go); cBody.appendChild(f);
    var cl = (await api.get('/api/classes')).classes;
    if (!cl.length) { cBody.appendChild(el('p', 'hint', t('sc_my_none'))); return; }
    var g = el('div', 'co-grid');
    cl.forEach(function (c) {
      var d = el('div', 'co-card'); d.appendChild(icon(c.name)); d.appendChild(el('h3', null, c.name)); d.appendChild(el('p', 'co-meta', c.org_name));
      if (c.teachers) d.appendChild(el('p', 'co-meta', t('sc_teachers_l') + ': ' + c.teachers));
      var a = el('div', 'co-actions');
      a.appendChild(btn('ghost sm', t('sc_leave'), async function () { try { await api.post('/api/classes/' + c.id + '/leave'); SS.toast(t('sc_left')); renderClasses(); } catch (e) { fail(e); } }));
      d.appendChild(a); g.appendChild(d);
    });
    cBody.appendChild(g);
  }

  async function showClass(id) {
    stopTimer(); openClass = id;
    async function paint() {
      if (openClass !== id) return;
      var d;
      try { d = await api.get('/api/classes/' + id); } catch (e) { fail(e); return renderClasses(); }
      if (openClass !== id) return;
      cBody.textContent = '';
      cBody.appendChild(btn('ghost', t('sc_back'), renderClasses));
      var head = el('div', 'sc-chead'); head.appendChild(icon(d.class.name));
      var hh = el('div'); hh.appendChild(el('h2', 'co-ptitle', d.class.name)); hh.appendChild(el('p', 'hint', d.class.orgName)); head.appendChild(hh); cBody.appendChild(head);
      var info = el('div', 'sc-info');
      var codeBox = el('div', 'sc-code'); codeBox.appendChild(el('span', 'sec-label', t('sc_code'))); codeBox.appendChild(el('strong', null, d.class.code));
      codeBox.appendChild(btn('ghost sm', t('sc_copy'), function () { try { navigator.clipboard.writeText(d.class.code); SS.toast(t('sc_copied')); } catch (e) {} }));
      codeBox.appendChild(el('p', 'hint', t('sc_code_note'))); info.appendChild(codeBox);
      info.appendChild(el('p', null, t('sc_teachers_l') + ': ' + (d.teachers.length ? d.teachers.map(function (x) { return x.displayName; }).join(', ') : t('sc_none'))));
      cBody.appendChild(info);
      if (!d.students.length) cBody.appendChild(el('p', 'sc-empty', t('sc_no_students')));
      else {
        var list = el('div', 'sc-students');
        d.students.forEach(function (s) {
          var c = el('div', 'sc-student');
          var top = el('div', 'sc-stop'); top.appendChild(icon(s.displayName)); var nm = el('div'); nm.appendChild(el('strong', null, s.displayName)); nm.appendChild(el('div', 'hint', '@' + s.username)); top.appendChild(nm);
          var online = s.lastSeen && d.serverTime - s.lastSeen < 150000;
          var st = el('span', 'sc-pill' + (online ? ' on' : ''), online ? t('sc_online') : (s.lastSeen ? t('sc_seen', { x: ago(s.lastSeen, d.serverTime) }) : t('sc_never')));
          top.appendChild(st); c.appendChild(top);
          var doing = s.view ? s.view + (s.detail ? ' · ' + s.detail : '') : t('sc_idle');
          c.appendChild(el('p', null, t('sc_doing') + ': ' + doing));
          c.appendChild(el('p', 'hint', t('sc_tutor_msgs', { n: s.tutorMessages })));
          if (s.tools.length) { var tl = el('div', 'sc-chips'); tl.appendChild(el('span', 'hint', t('sc_tools') + ':')); s.tools.forEach(function (x) { tl.appendChild(el('span', 'sc-chip', x.tool + ' × ' + x.n)); }); c.appendChild(tl); }
          if (s.scores.length) { var sl = el('div', 'sc-chips'); sl.appendChild(el('span', 'hint', t('sc_scores') + ':')); s.scores.forEach(function (x) { sl.appendChild(el('span', 'sc-chip', x.title + ' ' + x.score + '/' + x.total)); }); c.appendChild(sl); }
          c.appendChild(btn('ghost sm', t('sc_chats'), function () { showChats(id, s); }));
          list.appendChild(c);
        });
        cBody.appendChild(list);
      }
      if (role() === 'founder') {
        var del = btn('ghost sm', t('sc_del_class'), async function () {
          if (!confirm(t('sc_del_class_q'))) return;
          try { await api.del('/api/classes/' + id); SS.toast(t('sc_deleted')); renderClasses(); } catch (e) { fail(e); }
        });
        del.classList.add('danger'); cBody.appendChild(del);
      }
    }
    await paint();
    cTimer = setInterval(function () { if (!document.hidden && SS.currentView() === 'classes') paint(); }, 20000);
  }

  async function showChats(classId, s) {
    var m = SS.modal(t('sc_chats') + ' · ' + s.displayName, 'wide');
    try {
      var r = await api.get('/api/classes/' + classId + '/students/' + s.id + '/chats');
      if (!r.chats.length) { m.body.appendChild(el('p', 'hint', t('sc_no_chats'))); return; }
      var log = el('div', 'sc-log');
      r.chats.forEach(function (c) {
        var row = el('div', 'sc-msg ' + c.role);
        row.appendChild(el('div', 'hint', (c.role === 'user' ? t('sc_you') : t('sc_ai')) + ' · ' + c.tool + ' · ' + new Date(c.at).toLocaleString()));
        row.appendChild(el('div', null, c.content)); log.appendChild(row);
      });
      m.body.appendChild(log); log.scrollTop = log.scrollHeight;
    } catch (e) { m.body.appendChild(el('p', 'status err', e.message)); }
  }

  /* ---------- Organizations view ---------- */
  var tRoot, tBody;
  async function renderTeachers() {
    if (!tBody) return;
    tBody.textContent = '';
    if (role() === 'teacher') return renderJoin();
    var bar = el('div', 'sc-bar'); bar.appendChild(btn('', t('co_org_create'), function () { createOrg(renderTeachers); })); tBody.appendChild(bar);
    var d;
    try { d = await api.get('/api/teachers'); } catch (e) { tBody.appendChild(el('p', 'status err', e.message)); return; }
    if (!d.orgs.length) { tBody.appendChild(el('p', 'sc-empty', t('tt_no_orgs'))); return; }
    d.orgs.forEach(function (o) {
      var box = el('section', 'sc-org');
      var h = el('div', 'sc-orgh'); h.appendChild(icon(o.name)); var hh = el('div'); hh.appendChild(el('h2', null, o.name)); hh.appendChild(el('span', 'hint', t('tt_visibility_' + o.visibility) + ' · ' + t('tt_classes_n', { n: o.classes.length }))); h.appendChild(hh); box.appendChild(h);
      var inv = el('div', 'sc-join'); var ui = inp(t('tt_username'), 24);
      var go = btn('ghost', t('tt_invite'), async function () {
        if (!ui.value.trim()) return; go.disabled = true;
        try { var r = await api.post('/api/orgs/' + o.id + '/invite', { username: ui.value }); SS.toast(r.status === 'active' ? t('tt_added') : t('tt_invited')); renderTeachers(); }
        catch (e) { fail(e); go.disabled = false; }
      });
      ui.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
      inv.appendChild(ui); inv.appendChild(go); box.appendChild(inv);
      if (o.requests.length) {
        box.appendChild(el('h3', null, t('tt_requests')));
        o.requests.forEach(function (u) {
          var r = el('div', 'sc-row'); r.appendChild(el('strong', null, u.displayName)); r.appendChild(el('span', 'hint', '@' + u.username));
          var a = el('span', 'co-actions');
          a.appendChild(btn('sm', t('tt_accept'), function () { decide(o.id, u.id, true); }));
          a.appendChild(btn('ghost sm', t('tt_decline'), function () { decide(o.id, u.id, false); }));
          r.appendChild(a); box.appendChild(r);
        });
      }
      if (o.invited.length) { box.appendChild(el('h3', null, t('tt_invites'))); o.invited.forEach(function (u) { var r = el('div', 'sc-row'); r.appendChild(el('strong', null, u.displayName)); r.appendChild(el('span', 'hint', '@' + u.username)); box.appendChild(r); }); }
      if (!o.teachers.length) box.appendChild(el('p', 'hint', t('tt_no_teachers')));
      o.teachers.forEach(function (u) {
        var c = el('div', 'sc-student');
        var top = el('div', 'sc-stop'); top.appendChild(icon(u.displayName)); var nm = el('div'); nm.appendChild(el('strong', null, u.displayName)); nm.appendChild(el('div', 'hint', '@' + u.username)); top.appendChild(nm);
        var online = u.lastSeen && d.serverTime - u.lastSeen < 150000;
        top.appendChild(el('span', 'sc-pill' + (online ? ' on' : ''), online ? t('sc_online') : (u.lastSeen ? t('sc_seen', { x: ago(u.lastSeen, d.serverTime) }) : t('sc_never')))); c.appendChild(top);
        c.appendChild(el('p', null, t('sc_doing') + ': ' + (u.view ? u.view + (u.detail ? ' · ' + u.detail : '') : t('sc_idle'))));
        var tl = el('div', 'sc-chips'); tl.appendChild(el('span', 'hint', t('tt_using') + ':'));
        if (!u.tools.length) tl.appendChild(el('span', 'hint', t('sc_none'))); u.tools.forEach(function (x) { tl.appendChild(el('span', 'sc-chip', x.tool + ' × ' + x.n)); }); c.appendChild(tl);
        c.appendChild(el('div', 'sec-label', t('tt_assign')));
        if (!o.classes.length) c.appendChild(el('p', 'hint', t('tt_no_cls')));
        var cl = el('div', 'sc-chips');
        o.classes.forEach(function (k) {
          var lab = el('label', 'check'); var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = u.classIds.indexOf(k.id) >= 0;
          cb.addEventListener('change', async function () {
            var ids = o.teachers.filter(function (x) { return x.id !== u.id && x.classIds.indexOf(k.id) >= 0; }).map(function (x) { return x.id; });
            if (cb.checked) ids.push(u.id);
            try { await api.put('/api/classes/' + k.id + '/teachers', { userIds: ids }); if (cb.checked) u.classIds.push(k.id); else u.classIds = u.classIds.filter(function (z) { return z !== k.id; }); }
            catch (e) { cb.checked = !cb.checked; fail(e); }
          });
          lab.appendChild(cb); lab.appendChild(el('span', null, k.name)); cl.appendChild(lab);
        });
        c.appendChild(cl);
        c.appendChild(btn('ghost sm', t('tt_remove'), async function () { try { await api.del('/api/orgs/' + o.id + '/members/' + u.id); renderTeachers(); } catch (e) { fail(e); } }));
        box.appendChild(c);
      });
      tBody.appendChild(box);
    });
  }
  async function decide(orgId, userId, accept) { try { await api.post('/api/orgs/' + orgId + '/decide', { userId: userId, accept: accept }); renderTeachers(); } catch (e) { fail(e); } }

  async function renderJoin() {
    var mine;
    try { mine = (await api.get('/api/orgs/mine')).orgs; } catch (e) { tBody.appendChild(el('p', 'status err', e.message)); return; }
    var invites = mine.filter(function (o) { return o.status === 'invited'; }), rest = mine.filter(function (o) { return o.status !== 'invited'; });
    if (invites.length) {
      tBody.appendChild(el('h2', null, t('jo_invites')));
      invites.forEach(function (o) {
        var r = el('div', 'sc-row'); r.appendChild(icon(o.name)); r.appendChild(el('strong', null, o.name)); r.appendChild(el('span', 'hint', t('jo_by', { name: o.owner })));
        var a = el('span', 'co-actions');
        a.appendChild(btn('sm', t('jo_accept'), async function () { try { await api.post('/api/orgs/' + o.id + '/respond', { accept: true }); renderTeachers(); } catch (e) { fail(e); } }));
        a.appendChild(btn('ghost sm', t('jo_decline'), async function () { try { await api.post('/api/orgs/' + o.id + '/respond', { accept: false }); renderTeachers(); } catch (e) { fail(e); } }));
        r.appendChild(a); tBody.appendChild(r);
      });
    }
    tBody.appendChild(el('h2', null, t('jo_mine')));
    if (!rest.length) tBody.appendChild(el('p', 'hint', t('jo_none_mine')));
    rest.forEach(function (o) {
      var r = el('div', 'sc-row'); r.appendChild(icon(o.name)); r.appendChild(el('strong', null, o.name)); r.appendChild(el('span', 'hint', t('jo_by', { name: o.owner })));
      r.appendChild(el('span', 'sc-pill' + (o.status === 'active' ? ' on' : ''), o.status === 'active' ? t('jo_active') : t('jo_pending')));
      r.appendChild(btn('ghost sm', t('jo_leave'), async function () { try { await api.post('/api/orgs/' + o.id + '/leave'); renderTeachers(); } catch (e) { fail(e); } }));
      tBody.appendChild(r);
    });
    tBody.appendChild(el('h2', null, t('jo_find')));
    tBody.appendChild(el('p', 'hint', t('jo_private_note')));
    var f = el('div', 'sc-join'); var qi = inp(t('jo_search'), 40); var res = el('div', 'sc-results');
    async function search() {
      res.textContent = '';
      try {
        var r = (await api.get('/api/orgs/public?q=' + encodeURIComponent(qi.value.trim()))).orgs;
        if (!r.length) res.appendChild(el('p', 'hint', t('jo_none')));
        r.forEach(function (o) {
          var row = el('div', 'sc-row'); row.appendChild(icon(o.name)); row.appendChild(el('strong', null, o.name)); row.appendChild(el('span', 'hint', t('jo_by', { name: o.owner })));
          row.appendChild(btn('sm', t('jo_request'), async function () { try { await api.post('/api/orgs/' + o.id + '/request'); SS.toast(t('jo_requested')); renderTeachers(); } catch (e) { fail(e); } }));
          res.appendChild(row);
        });
      } catch (e) { res.appendChild(el('p', 'status err', e.message)); }
    }
    qi.addEventListener('keydown', function (e) { if (e.key === 'Enter') search(); });
    f.appendChild(qi); f.appendChild(btn('', t('jo_search'), search)); tBody.appendChild(f); tBody.appendChild(res); search();
  }

  /* ---------- Register the views ---------- */
  function shell(r, titleKeys) {
    r.innerHTML = '<div class="wrap tool-page school"><div class="term-head"><h1></h1></div><div class="sc-body"></div></div>';
    var h = $('h1', r), r0 = role(); h.textContent = t(titleKeys[r0] || titleKeys.teacher);
    return $('.sc-body', r);
  }
  SS.registerView('classes', {
    init: function (r) { cRoot = r; cBody = shell(r, { founder: 'nav_class_track', teacher: 'nav_my_classes', student: 'nav_my_class' }); },
    onShow: function () { $('h1', cRoot).textContent = t({ founder: 'nav_class_track', teacher: 'nav_my_classes', student: 'nav_my_class' }[role()] || 'nav_my_classes'); renderClasses(); },
    onHide: stopTimer
  });
  SS.registerView('teachers', {
    init: function (r) { tRoot = r; tBody = shell(r, { founder: 'nav_teacher_track', teacher: 'nav_join_org' }); },
    onShow: function () { $('h1', tRoot).textContent = t(role() === 'founder' ? 'nav_teacher_track' : 'nav_join_org'); renderTeachers(); }
  });
  SS.onAuth(function (ok) { if (!ok) { stopTimer(); if (cBody) cBody.textContent = ''; if (tBody) tBody.textContent = ''; } });
})();
