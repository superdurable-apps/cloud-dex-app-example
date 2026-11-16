/** The application's page, served for every GET outside /api: submit a name and read its greeting. */
export const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Greeting</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 36rem; margin: 2rem auto; padding: 0 1rem; color: #1f2937; }
  label { display: block; margin: 0.75rem 0 0.25rem; font-weight: 600; }
  input, select { width: 100%; padding: 0.5rem; box-sizing: border-box; }
  button { margin-top: 1rem; padding: 0.5rem 1rem; }
  #result { margin-top: 1.5rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem; }
</style>
</head>
<body>
<h1>Greeting</h1>
<p>Submit a name. The process writes its greeting in the chosen language and saves it.</p>
<form id="submit">
  <label for="name">Name</label>
  <input id="name" name="name" maxlength="80" required>
  <label for="language">Language</label>
  <select id="language" name="language">
    <option value="english">English</option>
    <option value="spanish">Spanish</option>
    <option value="french">French</option>
  </select>
  <button type="submit">Write the greeting</button>
</form>
<section id="result" aria-live="polite" hidden>
  <p><strong>Status:</strong> <span id="status"></span></p>
  <p id="greeting"></p>
</section>
<p id="error" role="alert"></p>
<script>
  const show = (id, text) => { document.getElementById(id).textContent = text ?? ""; };
  async function refresh(requestId) {
    const response = await fetch("/api/greetings/" + requestId);
    if (!response.ok) { show("error", "The greeting could not be read."); return; }
    const greeting = await response.json();
    document.getElementById("result").hidden = false;
    show("status", greeting.status);
    show("greeting", greeting.greeting ?? greeting.notice ?? "");
    if (greeting.status === "composing") setTimeout(() => refresh(requestId), 500);
  }
  document.getElementById("submit").addEventListener("submit", async (event) => {
    event.preventDefault();
    const requestId = crypto.randomUUID();
    show("error", "");
    const response = await fetch("/api/greetings", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId, name: document.getElementById("name").value,
        language: document.getElementById("language").value }) });
    if (!response.ok) { show("error", (await response.json()).error); return; }
    await refresh(requestId);
  });
</script>
</body>
</html>
`;
