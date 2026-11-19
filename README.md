# Juizi AI Chatbot

An AI chat bot block for Plone 6 / Volto that answers visitors' questions from the site's own content, through **ChatGPT (OpenAI)** or **Claude (Anthropic)**.

- **Backend:** `juizi.maps` (Plone 6.1). AI accounts with encrypted keys, the chat endpoints, the site search and the conversation log.
- **Frontend:** `volto-juizi-maps` (Volto 18). The **AI chat bot** block and the **Site Setup > AI Chatbot** screen.

Previously `volto-claude-chat-bot`, a Claude-only set of files that was only ever run on a local test instance. See [History](#history).

## How it works

```
Visitor's browser (AI chat bot block)
    | POST <page>/++api++/@chatbot   {block_id, messages}
    v
Plone (juizi.maps)
    | reads the block from the saved page: AI account, instructions, site-only switch
    | searches the catalog as the visitor (Plone security decides what they can be told about)
    | builds the instructions + the matching site content, numbered as sources
    v
ChatGPT (OpenAI Responses API) or Claude (Anthropic Messages API), with the account's own key
    ^
    | answer, ending with the numbers of the sources it used
Plone removes that line and returns the answer + only those sources
Browser shows the answer, with collapsible sources
```

- **Site search** (`backend/src/juizi/maps/search.py`): live keyword search of the catalog on every question. It tries the question's words as they are, then stemmed with wildcards ("frogs" finds "frog"), then pages with *any* of the words, best matches first, and finally upcoming events or recent news for questions about those. No reindexing is needed.
- **What the AI is given** for each page found: the title, the summary and the page's text, read from its Volto blocks (and from the rich-text field of older content), up to 6,000 characters a page; event dates, places and contacts; and for files, the text Plone extracted from them (PDFs need `pdftotext`, see below).
- **Sources:** the AI ends each answer with the numbers of the sources it actually used; only those are listed under the answer, and none when it couldn't answer from the site. If an answer comes back without that line, every page it was given is listed.
- **Keyword search has limits:** a question has to share words with a page to find it ("poisonous" doesn't find a page that only says "toxic", although the any-word step often still finds it through other words). Semantic search (RAG) is the planned next step, and would replace `search.py` only.
- **Content visibility** follows Plone's security model: anonymous visitors only get published content; logged-in users get what their roles allow. Files have no workflow, so restrict them with permissions if needed.
- **Conversations** stay in the visitor's browser (localStorage) for 24 hours, shared by every chat bot on the site. The per-visitor question limit is counted there too.
- **The conversation log** (one JSON line per answered question, rotated daily, kept 7 days) is downloadable as CSV from Site Setup > AI Chatbot.

## Security

Client accounts' keys and bills are what's at stake here, so:

- **The browser never decides what the AI is told or who pays.** `@chatbot` takes only the block's id and the conversation; the account, the instructions and the site-only switch are read from the block as saved on the page. (The Claude-only version took the instructions and the site-only switch from the browser, so anyone could call the endpoint with their own instructions and use the site's key as a free general-purpose AI.)
- **Editors preview unsaved settings** through `@chatbot-preview`, which requires permission to edit the page (or add content in the folder).
- **Requests are capped:** questions up to 2,000 characters, the last 20 messages and 30,000 characters of history, and answers up to 4,096 tokens.
- **Keys are encrypted at rest** with their own key, `AICHATBOT_ENCRYPTION_KEY` (separate from the payment and bulk-mail providers' keys). Secret fields are never sent back to the browser, not even to administrators: the screen only shows whether they're set. Each account uses its own key or nothing: the SDKs are never allowed to fall back to `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` in the server's environment.
- **Only site administrators** (`cmf.ManagePortal`) can see, add or change AI accounts or download the log. The block's account list is only shown to people who can edit content.
- **OpenAI doesn't keep the conversations** (`store=False`).
- **Errors are explained, keys aren't shown:** when the AI service refuses (wrong key, unknown model, out of credit, busy, unreachable), editors see a plain-language reason in the block and visitors see an apology. The service's own error is written to the Plone log.
- **Daily limit per account** ("Questions per day"): a first line of defence against misuse running up the bill. It's counted in memory per backend process, so with several processes the real ceiling is the limit times the number of processes. **Always set a monthly spending limit in the AI service's own dashboard as well**; that's the one that can't be got around.
- The block's instructions are part of the page's data, which anyone who can view the page can read through the API. Don't put anything private in them.

## Setting up a site

1. Install both packages (`juizi.maps` in the backend, `volto-juizi-maps` in the frontend's add-ons) and activate **juizi.maps** under Site Setup > Add-ons.
2. Generate an encryption key and set it in the backend's environment **before Plone starts**:

   ```shell
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

   ```shell
   AICHATBOT_ENCRYPTION_KEY=...
   ```

   It isn't picked up without a restart, and there's no recovery or rotation: if it's lost or changed, existing accounts can't be decrypted ("Stored credential could not be decrypted -- wrong or rotated AICHATBOT_ENCRYPTION_KEY?") and have to be deleted and added again. Keep it in the deployment's secrets, not only in a shell session.
3. In **Site Setup > AI Chatbot**, add an AI account: a name editors will recognise, the service, an API key made for this site only, and the model (for example `gpt-5.5`, or `claude-haiku-4-5` / `claude-sonnet-5-5` / `claude-opus-5-5`). For Claude, a key created for the whole Anthropic organisation (rather than inside a workspace) also needs the **Workspace ID** (`wrkspc_…`, from the Claude Console's Workspaces page). Set **Questions per day**. The card shows **Connected** once the key and model check out (the check costs nothing: it looks the model up, it doesn't ask it anything).
4. Set a spending limit in the OpenAI or Anthropic dashboard, and make sure the account has credit: **Connected** only proves the key and model work, so an account without credit still shows it, and the first question then fails with "The AI account has run out of credit".
5. Editors add the **AI chat bot** block to a page and choose the account.

Optional: `AICHATBOT_LOG_DIR` puts the conversation log somewhere other than the instance's `var/log`.

For PDFs to be searchable by their content, the server needs `pdftotext` (poppler-utils). PDFs uploaded before it was installed need the `SearchableText` index rebuilt (ZMI > `portal_catalog` > Indexes).

### Adding another AI service

One module under `backend/src/juizi/maps/providers/` plus one line in `providers/registry.py`; the screen, the endpoints and the block need no changes. Follow `providers/base.py`: a stable `PROVIDER_TYPE`, a `PROVIDER_LABEL`, `FIELDS` (mark keys `secret=True`), and a class with `chat()` and a free `check_connection()` that raises `ProviderError` with a plain-language message. Use the service's official SDK, construct its client with the stored key only, and note the API version and the date you checked its docs in the module's docstring.

## History

This started as `volto-claude-chat-bot`: files copied into a local test project, talking to Claude only, with the key in `CLAUDE_API_KEY`. It never ran on a site, so nothing needs migrating. What changed on the way here: AI accounts instead of environment variables, ChatGPT as well as Claude, the block's settings read from the saved page instead of the request, no hard-coded CORS policy (that belongs in a deployment's configuration), and no legacy static indexer or `@chatbot-reindex` endpoint. The block id (`chatbot`) and its fields are unchanged.

## Deployment notes: NITheCS

Not yet deployed. Before go-live:

- [ ] Confirm `pdftotext` is installed (`which pdftotext`): NITheCS has significant research PDFs.
- [ ] Set `AICHATBOT_ENCRYPTION_KEY`, add the ChatGPT account, set **Questions per day**, and set a spending limit in the OpenAI dashboard.
- [ ] **Test ChatGPT end to end with NITheCS's OpenAI account.** So far Claude has been tested with real answers; ChatGPT only up to the key and model check and OpenAI's out-of-credit error, because no funded OpenAI account was available. Ask a few questions on a test page and check the answers, the sources and the conversation log.
- [ ] Choose the account in each chat bot block.
- [ ] Tune the block's instructions once real content is loaded: naming NITheCS and what the site covers improves answers noticeably.
- [ ] Revoke the Claude key used while testing the first version: its notes record that it was briefly exposed.
- [ ] After the first week, download the conversations from Site Setup > AI Chatbot and read what people ask: it's the best signal for content gaps.

### Things to watch at scale

- **Relevance:** with hundreds of pages, keyword matching gets more competitive, and natural-language questions that don't share words with the content find nothing. That's the point to move to semantic search (embeddings), which replaces `search.py` only.
- **Performance:** each question wakes at most about ten content objects. Fine at NITheCS's size; watch response times under load.
- **Question limit:** the default of 10 a day per visitor may be tight for researchers; editors can raise it per block (0 = no limit).

## Quick Start 🏁

### Prerequisites ✅

-   An [operating system](https://6.docs.plone.org/install/create-project-cookieplone.html#prerequisites-for-installation) that runs all the requirements mentioned.
-   [uv](https://6.docs.plone.org/install/create-project-cookieplone.html#uv)
-   [nvm](https://6.docs.plone.org/install/create-project-cookieplone.html#nvm)
-   [Node.js and pnpm](https://6.docs.plone.org/install/create-project.html#node-js) 22
-   [Make](https://6.docs.plone.org/install/create-project-cookieplone.html#make)
-   [Git](https://6.docs.plone.org/install/create-project-cookieplone.html#git)
-   [Docker](https://docs.docker.com/get-started/get-docker/) (optional)

### Installation 🔧

```shell
git clone git@github.com:juizi-com/juizi-maps.git
cd juizi-maps
make install
```

### Fire Up the Servers 🔥

1.  Create a new Plone site on your first run: `make backend-create-site`
2.  Give your local instance an encryption key (once), in `backend/.env.secret`, which git ignores:

    ```shell
    echo "AICHATBOT_ENCRYPTION_KEY=$(cd backend && uv run python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')" > backend/.env.secret
    ```

    Then start the backend at http://localhost:8080/: `make backend-start`. The backend's Makefile reads the key from that file.

3.  In a new shell session, start the frontend at http://localhost:3000/: `make frontend-start`. Don't set `RAZZLE_API_PATH`: the browser then calls Plone directly and is blocked by CORS. Volto's development proxy already points at `http://localhost:8080/Plone`.

### Local Stack Deployment 📦

Deploy a local Docker Compose environment that includes the following.

- Docker images for Backend and Frontend 🖼️
- A stack with a Traefik router and a PostgreSQL database 🗃️
- Accessible at [http://juizi-maps.localhost](http://juizi-maps.localhost) 🌐

Run the following commands in a shell session.

```shell
make stack-create-site
make stack-start
```

And... you're all set! Your Plone site is up and running locally! 🚀

## Project structure 🏗️

This monorepo consists of the following distinct sections:

- **backend**: Houses the API and Plone installation, utilizing pip instead of buildout, and includes a policy package named juizi.maps.
- **frontend**: Contains the React (Volto) package.
- **devops**: Encompasses Docker stack, Ansible playbooks, and cache settings.

### Why this structure? 🤔

- All necessary codebases to run the site are contained within the repository (excluding existing add-ons for Plone and React).
- Specific GitHub Workflows are triggered based on changes in each codebase (refer to .github/workflows).
- Simplifies the creation of Docker images for each codebase.
- Demonstrates Plone installation/setup without buildout.

## Code quality assurance 🧐

To check your code against quality standards, run the following shell command.

```shell
make check
```

### Format the codebase

To format and rewrite the code base, ensuring it adheres to quality standards, run the following shell command.

```shell
make format
```

| Section | Tool | Description | Configuration |
| --- | --- | --- | --- |
| backend | Ruff | Python code formatting, imports sorting  | [`backend/pyproject.toml`](./backend/pyproject.toml) |
| backend | `zpretty` | XML and ZCML formatting  | -- |
| frontend | ESLint | Fixes most common frontend issues | [`frontend/.eslintrc.js`](.frontend/.eslintrc.js) |
| frontend | prettier | Format JS and Typescript code  | [`frontend/.prettierrc`](.frontend/.prettierrc) |
| frontend | Stylelint | Format Styles (css, less, sass)  | [`frontend/.stylelintrc`](.frontend/.stylelintrc) |

Formatters can also be run within the `backend` or `frontend` folders.

### Linting the codebase
or `lint`:

 ```shell
make lint
```

| Section | Tool | Description | Configuration |
| --- | --- | --- | --- |
| backend | Ruff | Checks code formatting, imports sorting  | [`backend/pyproject.toml`](./backend/pyproject.toml) |
| backend | Pyroma | Checks Python package metadata  | -- |
| backend | check-python-versions | Checks Python version information  | -- |
| backend | `zpretty` | Checks XML and ZCML formatting  | -- |
| frontend | ESLint | Checks JS / Typescript lint | [`frontend/.eslintrc.js`](.frontend/.eslintrc.js) |
| frontend | prettier | Check JS / Typescript formatting  | [`frontend/.prettierrc`](.frontend/.prettierrc) |
| frontend | Stylelint | Check Styles (css, less, sass) formatting  | [`frontend/.stylelintrc`](.frontend/.stylelintrc) |

Linters can be run individually within the `backend` or `frontend` folders.

## Internationalization 🌐

Generate translation files for Plone and Volto with ease:

```shell
make i18n
```

## Contributors

- Karel Calitz (Juizi) [karel@juizi.com]
- Claude (Anthropic), AI coding assistant, via Claude Code

## Credits and acknowledgements 🙏

Generated using [Cookieplone (1.1.0)](https://github.com/plone/cookieplone) and [cookieplone-templates (8e49881)](https://github.com/plone/cookieplone-templates/commit/8e498811980e38b7db5d5cb0f5645256feaa8799) on 2026-10-01 07:18:52.591424. A special thanks to all contributors and supporters!
