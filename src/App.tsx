import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, Copy, Download, Loader2, Eye, EyeOff, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const SUPPORTED_LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'chi_tra', name: 'Chinese (Traditional)' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'rus', name: 'Russian' },
  { code: 'ara', name: 'Arabic' },
  { code: 'hin', name: 'Hindi' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'nld', name: 'Dutch' },
  { code: 'pol', name: 'Polish' },
  { code: 'tur', name: 'Turkish' },
  { code: 'vie', name: 'Vietnamese' },
  { code: 'tha', name: 'Thai' },
  { code: 'swe', name: 'Swedish' },
  { code: 'nor', name: 'Norwegian' },
];

const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/webp'
];

interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [showPreview, setShowPreview] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error('Unsupported file format', {
        description: 'Please upload an image file (PNG, JPEG, BMP, GIF, TIFF, WebP)'
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File too large', {
        description: 'Please upload an image smaller than 10MB'
      });
      return;
    }
    
    setSelectedFile(file);
    setExtractedText('');
    setProgress(0);
    setOcrResult(null);

    toast.success('Image loaded successfully', {
      description: `${file.name} (${getFileSize(file.size)})`
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const processOCR = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');
    setOcrResult(null);
    
    const startTime = Date.now();
    const processingToast = toast.loading('Processing image...', {
      description: 'Extracting text from your image'
    });
    
    try {
      const result = await Tesseract.recognize(
        selectedFile,
        language,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
              setProcessingStatus(`${m.status} (${Math.round(m.progress * 100)}%)`);
            } else {
              setProcessingStatus(m.status);
            }
          }
        }
      );
      
      const processingTime = (Date.now() - startTime) / 1000;
      const confidence = Math.round(result.data.confidence);
      
      setExtractedText(result.data.text);
      setOcrResult({
        text: result.data.text,
        confidence,
        processingTime
      });
      
      toast.success('Text extracted successfully!', {
        id: processingToast,
        description: `${confidence}% confidence • ${result.data.text.length} characters • ${processingTime.toFixed(1)}s`
      });
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Error processing image', {
        id: processingToast,
        description: 'Please try again with a different image or settings'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStatus('');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      toast.success('Text copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast.error('Failed to copy text to clipboard');
    }
  };

  const downloadText = () => {
    if (!extractedText) return;
    
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Text file downloaded!', {
      description: 'Check your downloads folder'
    });
  };

  const downloadJSON = () => {
    if (!ocrResult) return;
    
    const data = {
      ...ocrResult,
      language,
      filename: selectedFile?.name,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('JSON file downloaded!', {
      description: 'Check your downloads folder'
    });
  };

  const clearAll = () => {
    setSelectedFile(null);
    setExtractedText('');
    setProgress(0);
    setProcessingStatus('');
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Workspace cleared');
  };

  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Upload and Settings */}
          <div className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Image
                </CardTitle>
                <CardDescription>
                  Drag and drop an image or click to select. Supports PNG, JPEG, BMP, GIF, TIFF, WebP (max 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileImage className="h-12 w-12 mx-auto text-green-500" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {getFileSize(selectedFile.size)}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {selectedFile.type.split('/')[1].toUpperCase()}
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-lg font-medium">Drop your image here</p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Recognition Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the primary language of the text in your image for better accuracy
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Show Image Preview</label>
                    <p className="text-xs text-gray-500">Toggle image preview visibility</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={processOCR}
                disabled={!selectedFile || isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Extract Text'
                )}
              </Button>
              <Button variant="outline" onClick={clearAll} size="lg">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{processingStatus}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <p className="text-xs text-gray-500 text-center">
                      This may take a few moments depending on image size and complexity
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* OCR Results Summary */}
            {ocrResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{ocrResult.confidence}%</p>
                      <p className="text-sm text-gray-500">Confidence</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{ocrResult.text.length}</p>
                      <p className="text-sm text-gray-500">Characters</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{ocrResult.processingTime.toFixed(1)}s</p>
                      <p className="text-sm text-gray-500">Processing Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview and Results */}
          <div className="space-y-6">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="result">Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>Image Preview</CardTitle>
                    <CardDescription>
                      {selectedFile ? `${selectedFile.name} • ${getFileSize(selectedFile.size)}` : 'No image selected'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-100px)]">
                    {selectedFile && showPreview ? (
                      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {selectedFile ? 'Preview disabled' : 'No image selected'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="result">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Text
                      {extractedText && (
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {extractedText.split('\n').length} lines
                          </Badge>
                          <Badge variant="secondary">
                            {extractedText.length} chars
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={downloadText}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {ocrResult && (
                            <Button variant="ghost" size="sm" onClick={downloadJSON} title="Download as JSON">
                              JSON
                            </Button>
                          )}
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {extractedText 
                        ? `${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || language}`
                        : 'Extracted text will appear here...'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-130px)]">
                    <Textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      placeholder="Extracted text will appear here after processing..."
                      className="h-full resize-none font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
