# AI CV Screening Bot

An intelligent CV screening application that helps recruiters and hiring managers quickly evaluate and rank job candidates using AI-powered analysis. The system processes uploaded CVs (PDF format) and provides detailed assessments based on customizable job requirements.

![AI CV Screening Bot](https://img.shields.io/badge/React-18.3.1-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115.5-green) ![Python](https://img.shields.io/badge/Python-3.8+-yellow) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-red)

## 🚀 Features

- **AI-Powered CV Analysis**: Leverages OpenAI's GPT models for intelligent CV evaluation
- **PDF Processing**: Supports PDF CV uploads with text extraction
- **Customizable Screening Criteria**: Define specific job requirements and qualifications
- **Candidate Ranking**: Automatically ranks candidates based on their match with job criteria
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Processing**: Fast CV analysis with instant feedback
- **Structured Output**: Detailed screening results with scores and recommendations

## 🏗️ Architecture

This project follows a modern full-stack architecture:

- **Frontend**: React 18 with Vite, Tailwind CSS, and custom UI components
- **Backend**: Python FastAPI with OpenAI integration
- **AI Processing**: OpenAI GPT models for CV analysis and ranking
- **File Processing**: PDF text extraction using PyPDF and pdfminer

```
ai-screening-bot/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── App.jsx       # Main application component
│   │   └── index.css     # Global styles
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
├── backend/           # Python FastAPI backend
│   ├── src/
│   │   └── main.py       # FastAPI application
│   └── requirements.txt  # Python dependencies
└── README.md
```

## 🛠️ Prerequisites

Before running this application, ensure you have:

- **Node.js**: Version 20.19+ or 22.12+ (required for Vite)
- **Python**: Version 3.8 or higher
- **OpenAI API Key**: Required for AI-powered CV analysis

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-screening-bot
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file and add your OpenAI API key
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install Node.js dependencies
npm install
```

## 🚀 Running the Application

### Start the Backend Server

```bash
# From the backend directory
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Start the Frontend Development Server

```bash
# From the frontend directory (in a new terminal)
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## 💻 Usage

1. **Open the Application**: Navigate to `http://localhost:5173` in your browser

2. **Upload CVs**: 
   - Click the "Choose Files" button to select PDF CVs
   - Multiple files can be uploaded simultaneously

3. **Define Job Requirements**:
   - Enter the job title and description
   - Specify required qualifications, skills, and experience
   - Set any additional screening criteria

4. **Configure Analysis**:
   - Choose whether to include detailed analysis
   - Set ranking preferences

5. **Process CVs**:
   - Click "Screen CVs" to start the AI analysis
   - Wait for processing to complete

6. **Review Results**:
   - View ranked candidates with scores
   - Read detailed analysis for each candidate
   - Export results if needed

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-3.5-turbo
MAX_FILE_SIZE=10485760  # Optional, max file size in bytes (10MB default)
```

### Frontend Configuration

The frontend can be configured through `vite.config.js`:

```javascript
export default defineConfig({
  // API proxy configuration
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

## 🎨 UI Components

The application includes a custom component library built with Tailwind CSS:

- **Button**: Primary and secondary button variants
- **Card**: Container components with headers and content areas
- **Input**: Form input fields with validation states
- **Textarea**: Multi-line text inputs with resizing controls
- **Switch**: Toggle switches for boolean options
- **Label**: Accessible form labels

## 📡 API Endpoints

### POST `/screen-cvs`
Processes uploaded CVs and returns screening results.

**Request Body:**
- `files`: Array of PDF files
- `job_requirements`: Object containing job criteria
- `include_detailed_analysis`: Boolean for detailed output

**Response:**
```json
{
  "results": [
    {
      "filename": "candidate1.pdf",
      "score": 85,
      "ranking": 1,
      "analysis": "Detailed analysis...",
      "recommendations": "Hiring recommendations..."
    }
  ],
  "summary": {
    "total_candidates": 5,
    "processing_time": "2.3s"
  }
}
```

## 🧪 Development

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Backend Development

```bash
# Run with auto-reload
uvicorn src.main:app --reload

# Run tests (if implemented)
pytest

# Format code
black src/
```

## 🚀 Production Deployment

### Frontend Build

```bash
cd frontend
npm run build
```

The built files will be in the `dist/` directory.

### Backend Deployment

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with production settings
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Node.js Version Error**
```bash
Error: Vite requires Node.js version >=20.19.0 or >=22.12.0
```
**Solution**: Upgrade Node.js to version 20.19+ or 22.12+

**OpenAI API Key Missing**
```bash
Error: OpenAI API key not provided
```
**Solution**: Add your OpenAI API key to the `.env` file in the backend directory

**PDF Processing Errors**
```bash
Error: Could not extract text from PDF
```
**Solution**: Ensure the PDF files are not password-protected and contain extractable text

**CORS Issues**
```bash
Error: Access blocked by CORS policy
```
**Solution**: The FastAPI backend includes CORS middleware. Ensure both frontend and backend are running on their respective ports.

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Review the API documentation at `http://localhost:8000/docs`
- Ensure all dependencies are properly installed
- Verify your OpenAI API key has sufficient credits

## 🔮 Future Enhancements

- [ ] Support for additional file formats (DOCX, TXT)
- [ ] Batch processing with progress indicators
- [ ] User authentication and session management
- [ ] Database integration for storing results
- [ ] Advanced filtering and search capabilities
- [ ] Integration with ATS (Applicant Tracking Systems)
- [ ] Multi-language CV support
- [ ] Machine learning model training on screening data

---

Built with ❤️ using React, FastAPI, and OpenAI
