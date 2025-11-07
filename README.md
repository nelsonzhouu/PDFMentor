# PDFMentor

AI-powered PDF assistant that lets you upload PDF documents and ask questions about their content using Google's Gemini AI.

## Features

- 📤 **Drag-and-drop PDF upload** with validation
- 📄 **Scrollable PDF viewer** for easy document review
- 🖍️ **Text highlighting** with multiple colors and click-to-delete
- 🌙 **Dark mode** for comfortable viewing
- 💬 **Interactive Q&A chatbox** powered by Gemini AI
- 🔒 **Rate limiting** (40 questions per hour)
- 🧠 **Semantic search** using FAISS vector store
- 🤖 **Powered by Google Gemini AI** (free tier)
- 🛡️ **Security-first** with comprehensive file validation

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **react-pdf** for PDF viewing
- **Axios** for API calls

### Backend
- **Flask** (Python)
- **PyPDF2** for PDF processing
- **Google Generative AI** (Gemini)
- **FAISS** for vector similarity search
- **Session-based rate limiting**

## Project Structure

```
PDFMentor/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilities
│   └── ...
├── backend/           # Flask Python backend
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   └── ...
└── README.md
```

## Setup Instructions

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** (3.12 recommended)
- **Google Gemini API key** (free at https://aistudio.google.com/api-keys)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Add your Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_api_key_here
```

6. Run the backend:
```bash
python run.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Toggle dark mode using the moon/sun icon in the header (optional)
3. Drag and drop a PDF file or click to browse
4. Wait for the PDF to be processed (this creates embeddings)
5. **Highlight text**: Select text in the PDF, click the highlight button, and choose a color
6. **Delete highlights**: Click on a highlighted area to show the delete icon, then click it
7. Ask questions about the PDF in the chatbox
8. Get AI-powered answers based on the document content

## Security Features

- ✅ **File type validation** (PDF magic bytes check)
- ✅ **File size limits** (50MB max)
- ✅ **Extension validation** (PDF only)
- ✅ **Filename sanitization** (prevents path traversal)
- ✅ **Rate limiting** (40 questions/hour)
- ✅ **CORS protection**
- ✅ **Input validation** and sanitization
- ✅ **Temporary file storage** (PDFs deleted after processing)

## API Endpoints

### POST /api/upload
Upload and process a PDF file

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF file)

**Response:**
```json
{
  "success": true,
  "documentId": "uuid",
  "filename": "document.pdf",
  "pageCount": 10,
  "message": "PDF processed successfully"
}
```

### POST /api/chat
Ask a question about an uploaded document

**Request:**
```json
{
  "document_id": "uuid",
  "question": "What is this document about?"
}
```

**Response:**
```json
{
  "answer": "This document is about...",
  "rateLimitInfo": {
    "questionsRemaining": 39,
    "resetTime": "2025-01-01T12:00:00"
  }
}
```

### GET /api/rate-limit
Check current rate limit status

**Response:**
```json
{
  "questionsRemaining": 40,
  "resetTime": "2025-01-01T12:00:00"
}
```

### DELETE /api/documents/:id
Delete a document's vector store data

**Note:** Original PDF files are automatically deleted after processing, so this only removes the vector embeddings.

**Response:**
```json
{
  "success": true
}
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# Rate Limiting
RATE_LIMIT_QUESTIONS=40
RATE_LIMIT_WINDOW=3600

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_FOLDER=uploads

# CORS
CORS_ORIGINS=http://localhost:3000
```

## Free Tier Limits

- **Gemini API**: 60 requests per minute (free tier)
- **File size**: 50MB max
- **Questions**: 40 per hour per session
- **Models used**:
  - Embeddings: `models/gemini-embedding-001`
  - LLM: `gemini-2.0-flash-lite`

## How It Works

1. **PDF Upload**: User uploads a PDF file
2. **Text Extraction**: Backend extracts text using PyPDF2
3. **Chunking**: Text is split into overlapping chunks (1000 chars each)
4. **Embedding**: Gemini generates vector embeddings for each chunk
5. **Vector Store**: Embeddings are stored in FAISS index
6. **Cleanup**: Original PDF is deleted (only embeddings are kept)
7. **Question**: User asks a question
8. **Query Embedding**: Question is converted to vector embedding
9. **Semantic Search**: FAISS finds most similar chunks
10. **Answer Generation**: Gemini generates answer using relevant context
11. **Response**: Answer is returned to user

## Troubleshooting

### Backend won't start
- Make sure you've created a `.env` file with your `GEMINI_API_KEY`
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (needs 3.11+, 3.12 recommended)

### Frontend won't start
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (needs 18+)

### PDF upload fails
- Check file size (must be under 50MB)
- Ensure file is a valid PDF
- Check backend logs for detailed error

### Rate limit issues
- Rate limit resets after 1 hour
- Uses session-based tracking (cookies must be enabled)

## Future Enhancements

- [ ] User authentication
- [ ] Document history/library
- [ ] Multiple document support
- [ ] Export chat history
- [ ] Advanced search filters
- [ ] Support for more file types (DOCX, TXT, etc.)
- [ ] Redis-based rate limiting for production
- [ ] Streaming responses for longer answers

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [Google Gemini AI](https://ai.google.dev/)
- PDF rendering by [react-pdf](https://github.com/wojtekmaj/react-pdf)
- Vector search powered by [FAISS](https://github.com/facebookresearch/faiss)
