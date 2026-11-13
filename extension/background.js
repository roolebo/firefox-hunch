// Polls hunch-browser-server for the agent's commands, runs them and posts
// the replies: an extension can connect to a server but can't listen.

const RETRY_DELAY = 3000;
// Larger HTML in context would crowd out the rest; dom fetches it
const MAX_SELECTION_HTML = 10000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function activeTab() {
  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
}

// Runs FN in the active tab's page. FN is sent as source, so it sees only
// its arguments, not this script.
async function inPage(fn, ...args) {
  const tab = await activeTab();
  const code = `(${fn})(...${JSON.stringify(args)})`;
  const [result] = await browser.tabs.executeScript(tab.id, { code });
  return result;
}

function pageSelection(maxHtml) {
  function cssPath(el) {
    const parts = [];
    for (; el && el !== document.documentElement; el = el.parentElement) {
      if (el.id) {
        parts.unshift(`#${CSS.escape(el.id)}`);
        break;
      }
      const tag = el.tagName.toLowerCase();
      const same = [...el.parentElement.children].filter(
        (child) => child.tagName === el.tagName,
      );
      parts.unshift(
        same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(el) + 1})` : tag,
      );
    }
    return parts.join(" > ");
  }

  const selection = getSelection();
  if (selection.isCollapsed) return null;
  let el = selection.getRangeAt(0).commonAncestorContainer;
  if (el.nodeType !== Node.ELEMENT_NODE) el = el.parentElement;
  while (el.parentElement && getComputedStyle(el).display.startsWith("inline"))
    el = el.parentElement;
  const html = el.outerHTML;
  return {
    text: selection.toString(),
    selector: cssPath(el),
    html: html.length <= maxHtml ? html : null,
  };
}

function pageDom(selector) {
  const roots = selector
    ? [...document.querySelectorAll(selector)]
    : [document.documentElement];
  if (roots.length === 0) throw new Error(`No element matches ${selector}`);
  return roots
    .map((root) => {
      const copy = root.cloneNode(true);
      copy.querySelectorAll("script, style, svg").forEach((el) => el.remove());
      return copy.outerHTML;
    })
    .join("\n");
}

const COMMANDS = {
  async context() {
    const tab = await activeTab();
    const tabs = await browser.tabs.query({});
    let selection = null;
    try {
      selection = await inPage(pageSelection, MAX_SELECTION_HTML);
    } catch (e) {
      // Firefox runs no scripts in pages such as about:, yet the tab is
      // still context
      console.debug("hunch: no selection:", e);
    }
    return {
      tab: tab.id,
      url: tab.url,
      title: tab.title,
      selection,
      tabs: tabs.map((t) => ({
        tab: t.id,
        url: t.url,
        title: t.title,
        active: t.active,
      })),
    };
  },
  selection: () => inPage(() => getSelection().toString()),
  read: () => inPage(() => document.body.innerText),
  dom: (selector) => inPage(pageDom, selector),
};

async function run({ id, command, args }) {
  if (!Object.hasOwn(COMMANDS, command))
    return { id, error: `No such command: ${command}` };
  try {
    return { id, result: await COMMANDS[command](...args) };
  } catch (e) {
    return { id, error: e.message || String(e) };
  }
}

// The server tells browsers apart by this id, kept across restarts
async function browserId() {
  const { browserId } = await browser.storage.local.get("browserId");
  if (browserId) return browserId;
  const id = crypto.randomUUID();
  await browser.storage.local.set({ browserId: id });
  return id;
}

async function connection() {
  const { server, token } = await browser.storage.local.get([
    "server",
    "token",
  ]);
  if (!server || !token) return null;
  const id = encodeURIComponent(await browserId());
  return { server, id, headers: { Authorization: `Bearer ${token}` } };
}

async function poll() {
  for (;;) {
    const c = await connection();
    if (!c) {
      await sleep(RETRY_DELAY);
      continue;
    }
    try {
      const response = await fetch(`${c.server}/poll?browser=${c.id}`, {
        headers: c.headers,
      });
      if (response.status === 204) continue;
      if (!response.ok)
        throw new Error(`${response.status} ${await response.text()}`);
      const reply = await run(await response.json());
      await fetch(`${c.server}/reply`, {
        method: "POST",
        headers: { ...c.headers, "Content-Type": "application/json" },
        body: JSON.stringify(reply),
      });
    } catch (e) {
      console.warn(`hunch: ${c.server}:`, e);
      await sleep(RETRY_DELAY);
    }
  }
}

// Commands go to the browser the human used last
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) return;
  const c = await connection();
  if (!c) return;
  try {
    await fetch(`${c.server}/focus?browser=${c.id}`, {
      method: "POST",
      headers: c.headers,
    });
  } catch (e) {
    console.warn(`hunch: ${c.server}:`, e);
  }
});

poll();
