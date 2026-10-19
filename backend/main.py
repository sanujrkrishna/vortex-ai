from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.llms import Ollama

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)
PERSIST_DIRECTORY = "chroma_db"

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
llm = Ollama(model="llama3")

chat_history = []


class ChatRequest(BaseModel):
    question: str


def rebuild_vector_store():
    """Rebuilds ChromaDB from all PDFs currently in the UPLOAD_DIR folder."""
    if os.path.exists(PERSIST_DIRECTORY):
        shutil.rmtree(PERSIST_DIRECTORY)
        
    pdf_files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith(".pdf")]
    if not pdf_files:
        return 0

    all_docs = []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    for pdf in pdf_files:
        file_path = os.path.join(UPLOAD_DIR, pdf)
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        docs = text_splitter.split_documents(documents)
        all_docs.extend(docs)

    if all_docs:
        Chroma.from_documents(
            documents=all_docs,
            embedding=embeddings,
            persist_directory=PERSIST_DIRECTORY
        )
    return len(pdf_files)


@app.get("/files")
async def list_files():
    """Returns a list of all uploaded PDF filenames in the vault."""
    pdf_files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith(".pdf")]
    return {"files": pdf_files}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global chat_history
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Rebuild vector store with all vault documents
        num_files = rebuild_vector_store()
        chat_history = []

        return {"message": f"Added {file.filename} to vault. Total vault files: {num_files}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/files/{filename}")
async def delete_file(filename: str):
    global chat_history
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)

        # Rebuild vector store without the deleted file
        rebuild_vector_store()
        chat_history = []

        return {"message": f"Successfully removed {filename} from vault."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat_with_doc(request: ChatRequest):
    global chat_history
    try:
        if not os.path.exists(PERSIST_DIRECTORY):
            raise HTTPException(status_code=400, detail="No vector database found. Please upload at least one PDF first.")

        vector_store = Chroma(
            persist_directory=PERSIST_DIRECTORY,
            embedding_function=embeddings
        )
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})

        relevant_docs = retriever.invoke(request.question)
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        sources = list(set([os.path.basename(doc.metadata.get("source", "Unknown")) for doc in relevant_docs]))

        history_text = "\n".join([f"User: {h['user']}\nAI: {h['bot']}" for h in chat_history[-4:]])

        prompt = f"""You are an AI document assistant for Vortex AI. Answer the question accurately using the provided document context from the multi-document vault and previous conversation history.

Conversation History:
{history_text}

Document Context:
{context}

Current Question: {request.question}

Answer:"""

        response = llm.invoke(prompt)
        chat_history.append({"user": request.question, "bot": response})

        return {
            "answer": response,
            "sources": sources
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)