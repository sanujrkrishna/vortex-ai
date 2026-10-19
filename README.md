# Folio

Local RAG for PDFs: bind a document, ask a question, read the answer beside the retrieved passages.

## Run

Ollama must be running with `llama3` (or set `OLLAMA_MODEL`).

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite app proxies `/api` to the FastAPI server on port 8000.
