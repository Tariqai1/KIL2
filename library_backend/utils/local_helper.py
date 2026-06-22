import os
import uuid
import shutil
from fastapi import UploadFile

# Define base paths (matching your main.py setup)
PDF_DIR = "static/uploads/pdfs"
TXT_DIR = "static/uploads/texts"

# Ensure directories exist
os.makedirs(PDF_DIR, exist_ok=True)
os.makedirs(TXT_DIR, exist_ok=True)

def save_pdf_locally(file: UploadFile):
    """Saves a PDF file locally and returns the public URL path."""
    if not file:
        return None

    try:
        print(f"🚀 Saving PDF locally: {file.filename}")
        
        if not file.filename.lower().endswith(".pdf"):
            print("❌ Only PDF files allowed for this field")
            return None
                
        # Generate unique filename
        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(PDF_DIR, unique_filename)
        
        # Save file to the local directory
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return frontend URL (matches app.mount("/uploads") in main.py)
        local_url = f"/uploads/pdfs/{unique_filename}"
        print(f"✅ Local PDF Upload Success: {local_url}")
        return local_url

    except Exception as e:
        print(f"❌ Local PDF Save Error: {e}")
        return None

def save_txt_locally(file: UploadFile):
    """Saves a TXT file locally and returns the public URL path."""
    if not file:
        return None

    try:
        print(f"🚀 Saving TXT locally: {file.filename}")
        
        if not file.filename.lower().endswith(".txt"):
            print("❌ Only TXT files allowed for this field")
            return None
                
        # Generate unique filename
        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(TXT_DIR, unique_filename)
        
        # Save file to the local directory
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return frontend URL
        local_url = f"/uploads/texts/{unique_filename}"
        print(f"✅ Local TXT Upload Success: {local_url}")
        return local_url

    except Exception as e:
        print(f"❌ Local TXT Save Error: {e}")
        return None