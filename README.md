# firefox-hunch

A Firefox extension for [hunch]: an agent reads the page the human works
on. It implements the [browser protocol] and talks to hunch's browser
server, which may run on another host, e.g. the agent's remote machine.

## Setup

Run `hunch-browser-server` from hunch in a pane of the agent's tmux
window.

Download the signed extension, the `.xpi` of the [latest release]. In
Firefox, open `about:addons`, the gear menu, Install Add-on From File, and
pick it. In the add-on's preferences, set the server, e.g.
`http://HOST:PORT`, and the token.

To try changes, load `extension/manifest.json` from `about:debugging`,
This Firefox, Load Temporary Add-on instead. A temporary add-on stays
until Firefox restarts.

[hunch]: https://github.com/roolebo/hunch
[latest release]: https://github.com/roolebo/firefox-hunch/releases/latest
[browser protocol]: https://github.com/roolebo/hunch/blob/main/skills/hunch/BROWSER.md
