// src/components/book/BookFormUI.jsx
import React, { useState, useEffect } from 'react';
import { 
    PlusIcon, 
    ArrowPathIcon, 
    PaperClipIcon, 
    XCircleIcon, 
    CheckCircleIcon, 
    DocumentTextIcon, 
    PhotoIcon,
    DocumentIcon 
} from '@heroicons/react/24/outline';

// --- STYLES & CONSTANTS ---
const INPUT_BASE_CLASS = "block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 bg-white";
const LABEL_CLASS = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1";

// --- Reusable Components ---

const InputField = ({ label, id, type = "text", colSpan = "col-span-1", error, ...props }) => (
    <div className={`sm:${colSpan}`}>
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        <div className="relative">
            <input
                id={id}
                type={type}
                className={`${INPUT_BASE_CLASS} ${error ? 'ring-red-300 focus:ring-red-500' : ''}`}
                {...props}
            />
        </div>
    </div>
);

const TextAreaField = ({ label, id, colSpan = "col-span-full", rows = 3, ...props }) => (
    <div className={`sm:${colSpan}`}>
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        <textarea
            id={id}
            rows={rows}
            className={INPUT_BASE_CLASS}
            {...props}
        />
    </div>
);

const SelectField = ({ label, id, options = [], colSpan = "col-span-1", loading, placeholder = "Select...", ...props }) => (
    <div className={`sm:${colSpan}`}>
        <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
        <div className="relative">
            <select
                id={id}
                className={INPUT_BASE_CLASS}
                disabled={loading}
                {...props}
            >
                {loading ? <option>Loading...</option> : <option value="">{placeholder}</option>}
                {options && options.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
            </select>
        </div>
    </div>
);

// --- 🌟 Premium File Input (Self-Handling Display) ---
const FileInput = ({ 
    label, 
    id, 
    accept, 
    onChange, 
    currentUrl, 
    newFileName, 
    apiBaseUrl, 
    icon: Icon = PaperClipIcon, 
    theme = "default" 
}) => {
    // Local state to handle immediate UI feedback
    const [localFileName, setLocalFileName] = useState("");

    // Sync with parent prop if it changes (e.g., reset form)
    useEffect(() => {
        setLocalFileName(newFileName || ""); 
    }, [newFileName]);

    const handleLocalChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalFileName(file.name); 
        }
        if (onChange) onChange(e); 
    };

    // Styling Logic
    const isBlue = theme === "blue";
    const containerClasses = isBlue 
        ? "border-blue-300 bg-blue-50/50 hover:bg-blue-50" 
        : "border-gray-300 bg-white hover:bg-gray-50";
    
    const iconColor = isBlue ? "text-blue-500" : "text-gray-400";
    const activeText = isBlue ? "text-blue-600" : "text-indigo-600";
    const ringColor = isBlue ? "focus-within:ring-blue-500" : "focus-within:ring-indigo-500";

    return (
        <div className="sm:col-span-1 h-full flex flex-col">
            <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
            <div className={`flex-1 flex flex-col justify-center rounded-xl border-2 border-dashed ${containerClasses} px-6 py-6 transition-all duration-200 group relative ${ringColor}`}>
                
                <div className="text-center relative z-10">
                    <div className={`mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm mb-3 border ${isBlue ? 'border-blue-100' : 'border-gray-100'}`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
                    </div>
                    
                    <div className="mt-2 flex text-sm leading-6 text-gray-600 justify-center">
                        <label
                            htmlFor={id}
                            className={`relative cursor-pointer rounded-md font-bold ${activeText} focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 hover:underline`}
                        >
                            <span>{localFileName ? "Change File" : "Upload File"}</span>
                            <input id={id} name={id} type="file" accept={accept} className="sr-only" onChange={handleLocalChange} />
                        </label>
                    </div>
                    
                    <p className="text-xs leading-5 text-gray-500 mt-1 px-2 break-words">
                        {localFileName ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 animate-in fade-in slide-in-from-bottom-1">
                                <CheckCircleIcon className="w-3.5 h-3.5" /> 
                                <span className="truncate max-w-[150px]">{localFileName}</span>
                            </span>
                        ) : (
                            <span className="opacity-60">No file selected</span>
                        )}
                    </p>
                </div>

                {currentUrl && !localFileName && (
                    <div className="mt-4 text-center">
                        <a 
                            href={`${apiBaseUrl}${currentUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full transition-colors ${isBlue ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            <ArrowPathIcon className="w-3 h-3" /> View Existing
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
//           MAIN UI COMPONENT
// ==========================================
const BookFormUI = ({ 
    formData = {}, // Default empty object to prevent crashes
    languages = [], // Default empty array
    subcategories = [], // Default empty array
    initialData, 
    isEditing, 
    isLoading, 
    isDropdownLoading, 
    error, 
    successMessage, 
    coverImageName, 
    pdfFileName, 
    txtFileName, 
    onChange, 
    onSubcategoryChange, 
    onFileChange, 
    onSubmit 
}) => {
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    return (
        <form onSubmit={onSubmit} className="bg-white shadow-xl ring-1 ring-gray-900/5 sm:rounded-2xl md:col-span-2 overflow-hidden">
            
            {(error || successMessage) && (
                <div className={`px-6 py-4 flex items-center gap-3 ${error ? 'bg-red-50 border-b border-red-100' : 'bg-emerald-50 border-b border-emerald-100'}`}>
                    <div className={`flex-shrink-0 rounded-full p-1 ${error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {error ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                    </div>
                    <p className={`text-sm font-semibold ${error ? 'text-red-900' : 'text-emerald-900'}`}>
                        {error || successMessage}
                    </p>
                </div>
            )}

            <div className="px-6 py-8 sm:p-10 space-y-10">
                
                {/* 1. CORE INFO */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">01</span>
                        Core Details
                    </h2>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <InputField id="title" name="title" label="Book Title *" colSpan="col-span-4" value={formData.title || ''} onChange={onChange} required placeholder="e.g. Sahih Al-Bukhari" disabled={isLoading} />
                        <SelectField id="language_id" name="language_id" label="Language *" colSpan="col-span-2" options={languages} value={formData.language_id || ''} onChange={onChange} loading={isDropdownLoading} required disabled={isLoading} />
                        <InputField id="author" name="author" label="Author / Compiler" colSpan="col-span-3" value={formData.author || ''} onChange={onChange} disabled={isLoading} />
                        <InputField id="publisher" name="publisher" label="Publisher" colSpan="col-span-3" value={formData.publisher || ''} onChange={onChange} disabled={isLoading} />
                    </div>
                </div>

                {/* 2. SPECIFICATIONS */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">02</span>
                        Specifications
                    </h2>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <InputField id="isbn" name="isbn" label="ISBN" colSpan="col-span-2" value={formData.isbn || ''} onChange={onChange} disabled={isLoading} />
                        <InputField id="publication_year" name="publication_year" label="Year" type="number" colSpan="col-span-2" value={formData.publication_year || ''} onChange={onChange} min="1000" disabled={isLoading} />
                        <InputField id="pages" name="pages" label="Pages" type="number" colSpan="col-span-2" value={formData.pages || ''} onChange={onChange} min="1" disabled={isLoading} />
                        <InputField id="translator" name="translator" label="Translator" colSpan="col-span-3" value={formData.translator || ''} onChange={onChange} disabled={isLoading} />
                        <InputField id="edition" name="edition" label="Edition" colSpan="col-span-3" value={formData.edition || ''} onChange={onChange} placeholder="e.g. 1st Edition" disabled={isLoading} />
                    </div>
                </div>

                {/* 3. CLASSIFICATION */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">03</span>
                        Library Data
                    </h2>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <InputField id="serial_number" name="serial_number" label="Serial No." colSpan="col-span-2" value={formData.serial_number || ''} onChange={onChange} disabled={isLoading} />
                        <InputField id="book_number" name="book_number" label="Book No." colSpan="col-span-2" value={formData.book_number || ''} onChange={onChange} disabled={isLoading} />
                        <InputField id="subject_number" name="subject_number" label="Subject No." colSpan="col-span-2" value={formData.subject_number || ''} onChange={onChange} disabled={isLoading} />

                        <div className="sm:col-span-full">
                            <label htmlFor="subcategory_ids" className={LABEL_CLASS}>Categories & Genres</label>
                            <div className="relative">
                                <select 
                                    id="subcategory_ids" 
                                    name="subcategory_ids" 
                                    multiple 
                                    value={formData.subcategory_ids || []} 
                                    onChange={onSubcategoryChange} 
                                    size="5" 
                                    className={`${INPUT_BASE_CLASS} h-auto min-h-[120px]`} 
                                    disabled={isDropdownLoading || isLoading}
                                >
                                    {isDropdownLoading && <option>Loading categories...</option>}
                                    {subcategories && subcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id} className="py-1 px-2">{sub.category?.name} &rsaquo; {sub.name}</option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-xs text-gray-400 italic text-right">Hold Ctrl (Cmd) to select multiple</p>
                            </div>
                        </div>
                        <TextAreaField id="description" name="description" label="Description / Summary" value={formData.description || ''} onChange={onChange} disabled={isLoading} />
                    </div>
                </div>

                {/* 4. ASSETS (FILES) */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">04</span>
                        Digital Assets
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FileInput 
                            id="coverImageFile" 
                            label="Book Cover" 
                            accept="image/*" 
                            onChange={onFileChange} 
                            currentUrl={initialData?.cover_image_url} 
                            newFileName={coverImageName}
                            apiBaseUrl={API_URL}
                            icon={PhotoIcon}
                        />
                        <FileInput 
                            id="pdfFile" 
                            label="PDF Document" 
                            accept="application/pdf" 
                            onChange={onFileChange} 
                            currentUrl={initialData?.pdf_url} 
                            newFileName={pdfFileName}
                            apiBaseUrl={API_URL}
                            icon={DocumentIcon}
                        />
                        <FileInput 
                            id="txtFile" 
                            label="Research Text (For Search)" 
                            accept=".txt,.md,.docx" 
                            onChange={onFileChange} 
                            currentUrl={initialData?.txt_file_url} 
                            newFileName={txtFileName}
                            apiBaseUrl={API_URL}
                            icon={DocumentTextIcon}
                            theme="blue"
                        />
                    </div>
                </div>

                {/* 5. SETTINGS */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 tracking-wider">Access Control</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex gap-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm items-start cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => document.getElementById('is_restricted').click()}>
                            <div className="flex h-6 items-center">
                                <input id="is_restricted" name="is_restricted" type="checkbox" checked={formData.is_restricted || false} onChange={onChange} disabled={isLoading} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                            </div>
                            <div>
                                <label htmlFor="is_restricted" className="font-bold text-gray-900 cursor-pointer">Restricted Access</label>
                                <p className="text-gray-500 text-xs mt-0.5">Users must request permission to view/download.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm items-start cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => document.getElementById('is_digital').click()}>
                            <div className="flex h-6 items-center">
                                <input id="is_digital" name="is_digital" type="checkbox" checked={formData.is_digital || false} onChange={onChange} disabled={isLoading} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                            </div>
                            <div>
                                <label htmlFor="is_digital" className="font-bold text-gray-900 cursor-pointer">Digital Only</label>
                                <p className="text-gray-500 text-xs mt-0.5">No physical copy available in library.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- Footer --- */}
            <div className="flex items-center justify-end gap-x-4 border-t border-gray-200 px-6 py-5 bg-gray-50">
                {isEditing && (
                    <button type="button" className="text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg transition-all" onClick={() => window.history.back()}>
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading || isDropdownLoading}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            {isEditing ? <ArrowPathIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                            <span>{isEditing ? 'Update Book' : 'Add to Library'}</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default BookFormUI;