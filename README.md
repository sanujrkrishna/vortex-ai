# 🚀 Vortex AI — Full-Stack Private Local RAG Application

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-005571?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3%2B-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Llama_3-black?style=flat-square&logo=ollama&logoColor=white)](https://ollama.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Vortex AI is an advanced, production-grade, 100% private Retrieval-Augmented Generation (RAG) system engineered for absolute data privacy, zero cloud dependency, and zero third-party API costs. It empowers users to ingest multi-document PDF vaults, maintain sliding-window conversational memory, and query documents offline using state-of-the-art local LLMs.

## 📑 Table of Contents

- [System Architecture & Data Flow](#️-system-architecture--data-flow)
- [Tech Stack](#️-tech-stack)
- [Key Engineering Features](#-key-engineering-features)
- [Getting Started](#-getting-started)

---

## 🏛️ System Architecture & Data Flow

```
[ PDF Documents ] ──> [ FastAPI Backend ] ──> [ PyPDFLoader & Text Splitter ]
                             │
                             ▼
[ ChromaDB (Local Disk) ] <── [ Hugging Face Embeddings (all-MiniLM-L6-v2) ]
                             │
                             ▼
[ Ollama (Llama 3 Inference) ] ──> [ React & Tailwind CSS "Neural Matrix" UI ]
```

1. Ingestion & Chunking: PDFs are uploaded via the React interface, parsed via `PyPDFLoader`, and hierarchically split using `RecursiveCharacterTextSplitter` with chunk overlapping to preserve semantic continuity.
2. Vectorization & Persistence: Text chunks are converted into dense vector embeddings via Hugging Face's `all-MiniLM-L6-v2` and stored persistently in local ChromaDB.
3. Retrieval & Generation: User queries trigger cosine similarity search. Retrieved context and sliding-window chat history are injected into a strict system prompt, processed locally by Llama 3, and rendered with markdown formatting and source citations.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend | React, Vite, Tailwind CSS, Lucide React, ReactMarkdown | Immersive "Neural Matrix" dark UI with real-time markdown rendering. |
| Backend API | Python, FastAPI, LangChain | High-performance asynchronous API routing and RAG orchestration. |
| Embeddings | Hugging Face (`all-MiniLM-L6-v2`) | Lightweight local transformer model for semantic vector generation. |
| Vector Store | ChromaDB (Local Disk) | Embedded vector database providing fast, offline similarity search. |
| LLM Inference | Ollama (`Llama 3`) | Air-gapped local model inference ensuring zero data leakage and $0 cost. |

---

## ✨ Key Engineering Features

- 🔒 100% Air-Gapped Privacy: Documents and queries never touch third-party cloud APIs, guaranteeing enterprise-grade data security.
- 📂 Dynamic Multi-Document Vault: Supports concurrent PDF uploads, file listing (`GET /files`), and atomic file deletion with automatic vector store rebuilding.
- 🧠 Conversational Memory: Maintains an in-memory sliding-window history tracker to support multi-turn follow-up questions seamlessly.
- ⚡ Zero Cost & Offline Capable: Runs entirely on consumer hardware without external cloud or API subscription fees.

---

## 🚀 Getting Started

### Prerequisites

- [ ] Python 3.10+ installed
- [ ] Node.js & npm installed
- [ ] Ollama installed and running with Llama 3:

```bash
  ollama run llama3
```

### 1. Backend Setup (FastAPI)

Open a terminal in your project root and run:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Install dependencies and start the server:

```bash
pip install -r requirements.txt
python main.py
```

The backend runs on `http://localhost:8000`.

### 2. Frontend Setup (React & Vite)

Open a second terminal window in your project root and run:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.
