const form = document.querySelector("form");

browser.storage.local.get(["server", "token"]).then((saved) => {
  form.server.value = saved.server || "";
  form.token.value = saved.token || "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await browser.storage.local.set({
    server: form.server.value.trim().replace(/\/+$/, ""),
    token: form.token.value.trim(),
  });
  document.getElementById("status").textContent = "Saved";
});
