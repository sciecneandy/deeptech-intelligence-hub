const streams = {
  venture: ['週一', '產業與創投'],
  semiconductor: ['週二', '半導體與專利'],
  policy: ['週三', '科研補助與法規'],
  dd: ['週四', '技術學習與 DD']
};
const tabs = {
  main: '主文',
  technology: '技術原理',
  dd: '投資 DD',
  glossary: '名詞百科',
  sources: '原始來源'
};
const byId = id => document.getElementById(id);
let issues = [];
let stream = '';
let selection = '';
let revision = 0;
const cache = new Map();

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content !== undefined) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function button(text, click, className) {
  const node = element('button', text, className);
  node.type = 'button';
  node.addEventListener('click', click);
  return node;
}

function appendInline(node, value) {
  const tokens = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  for (const token of tokens) {
    if (token.startsWith('**') && token.endsWith('**')) node.append(element('strong', token.slice(2, -2)));
    else if (token.startsWith('`') && token.endsWith('`')) node.append(element('code', token.slice(1, -1)));
    else node.append(document.createTextNode(token));
  }
}

function renderMarkdown(body, source) {
  const lines = source.trim().split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^---+$/.test(line)) continue;
    if (line.startsWith('|') && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const wrap = element('div', undefined, 'table-wrap');
      const table = element('table');
      const addRow = (row, cellType, target) => {
        const tr = element('tr');
        for (const text of row.trim().slice(1, -1).split('|')) {
          const cell = element(cellType);
          if (cellType === 'th') cell.scope = 'col';
          appendInline(cell, text.trim());
          tr.append(cell);
        }
        target.append(tr);
      };
      const header = table.createTHead();
      addRow(line, 'th', header);
      const tbody = table.createTBody();
      i += 2;
      while (lines[i]?.trim().startsWith('|')) addRow(lines[i++], 'td', tbody);
      i--;
      wrap.append(table);
      body.append(wrap);
      continue;
    }
    const listMarker = /^(?:[-*]|\d+\.)\s+/;
    if (listMarker.test(line)) {
      const list = element(/^\d/.test(line) ? 'ol' : 'ul');
      while (listMarker.test(lines[i]?.trim() || '')) {
        const item = element('li');
        appendInline(item, lines[i++].trim().replace(listMarker, ''));
        list.append(item);
      }
      i--;
      body.append(list);
      continue;
    }
    const heading = /^#+\s+/.test(line);
    const block = element(heading ? 'h4' : 'p');
    appendInline(block, heading ? line.replace(/^#+\s+/, '') : line);
    body.append(block);
  }
}

function renderList() {
  const year = byId('year').value;
  const terms = byId('query').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = issues.filter(issue => {
    const text = [issue.title, issue.summary, issue.date, ...issue.tags].join(' ').toLocaleLowerCase();
    return (!stream || issue.stream === stream) && (!year || issue.date.startsWith(year)) &&
      terms.every(term => text.includes(term));
  });
  const list = byId('issues');
  list.replaceChildren();
  byId('count').textContent = `${filtered.length} 期週報`;
  for (const issue of filtered) {
    const link = element('a', undefined, 'issue');
    link.href = `#issue=${issue.id}`;
    if (selection === issue.id) link.setAttribute('aria-current', 'true');
    const time = element('time', `${issue.date} · ${streams[issue.stream][1]}`);
    time.dateTime = issue.date;
    link.append(time, element('strong', issue.title), element('span', issue.summary), element('span', '閱讀本期 →', 'read'));
    link.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      showReport(issue, true);
    });
    list.append(link);
  }
  if (!filtered.length) {
    const unpublished = stream && !issues.some(issue => issue.stream === stream);
    list.append(element('p', unpublished ? '尚未上架' : '目前沒有符合條件的週報。'));
  }
}

function clearReader() {
  revision++;
  selection = '';
  byId('reader').hidden = true;
  for (const id of ['report-title', 'report-meta', 'report-summary', 'reader-nav', 'report-body']) {
    byId(id).replaceChildren();
  }
}

function filter(next) {
  stream = next;
  byId('all').setAttribute('aria-pressed', String(!stream));
  for (const tab of byId('streams').children) tab.setAttribute('aria-pressed', String(tab.dataset.stream === stream));
  renderList();
}

function renderSection(issue, report, key) {
  const body = byId('report-body');
  body.replaceChildren();
  for (const tab of byId('reader-nav').children) tab.setAttribute('aria-pressed', String(tab.dataset.section === key));
  if (key === 'glossary') {
    for (const {term, definition} of report.glossary) {
      const row = element('details');
      row.append(element('summary', term), element('p', definition));
      body.append(row);
    }
    if (!report.glossary.length) body.append(element('p', '本期未收錄術語。'));
    return;
  }
  if (key === 'sources') {
    const list = element('ul');
    for (const {title, url} of report.sources) {
      if (!/^https:\/\//i.test(url)) continue;
      const item = element('li');
      const link = element('a', title);
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      item.append(link);
      list.append(item);
    }
    body.append(list);
    return;
  }
  for (const section of report.sections.filter(section => section.kind === key)) {
    body.append(element('h3', section.title));
    renderMarkdown(body, section.body);
  }
}

async function loadJson(path) {
  const response = await fetch(path, {cache: 'no-cache'});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function showReport(issue, focus = false) {
  const request = ++revision;
  selection = issue.id;
  renderList();
  byId('reader').hidden = false;
  byId('report-title').textContent = issue.title;
  byId('report-meta').textContent = `${issue.date} · ${streams[issue.stream].join(' · ')}`;
  byId('report-summary').textContent = issue.summary;
  byId('reader-nav').replaceChildren();
  byId('report-body').textContent = '正在載入本期…';
  if (focus) {
    byId('report-title').focus({preventScroll: true});
    byId('reader').scrollIntoView({block: 'start'});
  }
  try {
    const report = cache.get(issue.id) || await loadJson(`./reports/${issue.id}.json`);
    cache.set(issue.id, report);
    if (request !== revision) return;
    for (const [key, label] of Object.entries(tabs)) {
      if (key !== 'glossary' && key !== 'sources' && !report.sections.some(section => section.kind === key)) continue;
      const tab = button(label, () => renderSection(issue, report, key));
      tab.dataset.section = key;
      byId('reader-nav').append(tab);
    }
    renderSection(issue, report, 'main');
  } catch {
    if (request === revision) byId('report-body').textContent = '本期載入失敗。請重新點選本期後再試。';
  }
}

function readLocation(focus = false) {
  const requested = new URLSearchParams(location.hash.slice(1)).get('issue');
  const category = new URLSearchParams(location.hash.slice(1)).get('stream');
  const linked = issues.find(entry => entry.id === requested);
  const next = Object.hasOwn(streams, category) ? category : linked?.stream || '';
  clearReader();
  filter(next);
  const issue = requested ? linked : issues.find(entry => !next || entry.stream === next);
  if (issue && (!next || issue.stream === next)) showReport(issue, focus && Boolean(linked));
}

async function start() {
  for (const [id, [day, name]] of Object.entries(streams)) {
    const tab = button('', () => {
      history.pushState(null, '', '#stream=' + id);
      readLocation();
      byId('archive').scrollIntoView({block: 'start'});
    }, 'stream');
    tab.dataset.stream = id;
    tab.setAttribute('aria-pressed', 'false');
    tab.append(element('small', day), element('strong', name));
    byId('streams').append(tab);
  }
  byId('all').addEventListener('click', () => {
    history.pushState(null, '', '#archive');
    readLocation();
  });
  byId('year').addEventListener('change', renderList);
  byId('query').addEventListener('input', renderList);
  window.addEventListener('hashchange', () => readLocation(true));
  try {
    const embedded = byId('offline-archive');
    if (embedded) {
      const data = JSON.parse(embedded.textContent);
      for (const [id, report] of Object.entries(data.reports)) cache.set(id, report);
      issues = data.issues;
    } else {
      issues = await loadJson('./reports/index.json');
    }
    issues = issues.filter(issue => /^\d{4}-\d{2}-\d{2}-(venture|semiconductor|policy|dd)$/.test(issue.id) &&
      Object.hasOwn(streams, issue.stream) && issue.id === `${issue.date}-${issue.stream}`).sort((a, b) => b.date.localeCompare(a.date));
    for (const year of new Set(issues.map(issue => issue.date.slice(0, 4)))) {
      byId('year').append(element('option', year));
    }
    renderList();
    readLocation(Boolean(location.hash));
  } catch {
    byId('issues').textContent = '週報索引載入失敗。請重新整理後再試。';
  }
}

start();
