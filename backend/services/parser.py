import io
from pypdf import PdfReader
import docx

def parse_uploaded_file(filename: str, file_bytes: bytes) -> str:
    """
    Parses various file types (.md, .txt, .pdf, .docx) into a cleaned string.
    Gracefully handles empty or unreadable files.
    """
    ext = filename.lower().split(".")[-1] if "." in filename else "txt"
    
    try:
        if ext in ["md", "txt", "json", "yaml", "yml", "log"]:
            try:
                return file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                return file_bytes.decode("latin-1", errors="replace")
                
        elif ext == "pdf":
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            extracted_text = []
            for page_idx, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    extracted_text.append(f"--- Page {page_idx + 1} ---\n{page_text.strip()}")
            return "\n\n".join(extracted_text)
            
        elif ext in ["docx", "doc"]:
            doc_file = io.BytesIO(file_bytes)
            doc = docx.Document(doc_file)
            extracted_text = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(extracted_text)
            
        else:
            # Fallback to text decoding
            try:
                return file_bytes.decode("utf-8")
            except Exception:
                return file_bytes.decode("latin-1", errors="replace")
                
    except Exception as e:
        print(f"Error parsing file {filename}: {str(e)}")
        # If parsing binary fails, return error context rather than crashing
        return f"[Document parsing error for {filename}: {str(e)}]"
