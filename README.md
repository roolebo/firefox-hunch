# firefox-hunch

A Firefox extension for [hunch]: an agent reads the page the human works
on. It implements the [browser protocol] and talks to hunch's browser
server, which may run on another host, e.g. the agent's remote machine.

## Setup

Run `hunch-browser-server` from hunch in a pane of the agent's tmux
window.

In Firefox, open `about:debugging`, This Firefox, Load Temporary Add-on,
and pick `extension/manifest.json`. A temporary add-on stays until Firefox
restarts. In the add-on's preferences, set the server, e.g.
`http://HOST:PORT`, and the token.

[hunch]: https://github.com/roolebo/hunch
[browser protocol]: https://github.com/roolebo/hunch/blob/main/skills/hunch/BROWSER.md
