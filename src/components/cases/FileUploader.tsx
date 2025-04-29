
import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EvidenceItem } from "@/services/types";
import { useToast } from "@/hooks/use-toast";
import { createTimestamp } from "@/utils/dateUtils";
import { uploadToCloudinary } from "@/utils/cloudinaryService";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onFileUploaded: (file: EvidenceItem) => void;
}

export const FileUploader = ({ onFileUploaded }: FileUploaderProps) => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Reset any previous error messages
    setErrorMessage(null);
    
    // Add file size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    // Auto-fill title with filename
    setTitle(file.name.split(".")[0]);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setUploadProgress(0);
    setErrorMessage(null);
  };

  const simulateProgress = () => {
    // Simulate upload progress for better UX
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 90) {
          clearInterval(interval);
          return 90; // We'll set it to 100 when the upload is actually complete
        }
        return newProgress;
      });
    }, 300);
    
    return () => clearInterval(interval);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      const clearProgressSimulation = simulateProgress();
      
      // Upload the file to Cloudinary
      const fileUrl = await uploadToCloudinary(selectedFile, "evidence");
      setUploadProgress(100);
      
      const fileType =
        selectedFile.type.split("/")[0] === "image"
          ? "image"
          : selectedFile.type.includes("pdf")
          ? "document"
          : "other";

      const newEvidence: EvidenceItem = {
        title,
        description,
        type: fileType,
        url: fileUrl, // Use the Cloudinary URL
        uploadedAt: createTimestamp(new Date()),
        uploadedBy: "current-user" // Placeholder for actual user ID
      };

      // Clear the progress simulation
      clearProgressSimulation();
      
      onFileUploaded(newEvidence);
      clearSelection();

      toast({
        title: "Evidence Added",
        description: "Your evidence has been successfully uploaded and added",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress(0);
      
      // Show more informative error
      let errorMessage = "Failed to upload evidence. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Upload failed: ${error.message}`;
        setErrorMessage(error.message);
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag and drop your files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported file types: Images, PDFs, Documents (max 10MB)
            </p>
            <Input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleChange}
            />
            <Label
              htmlFor="file-upload"
              className="mt-2 cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Select File
            </Label>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-[400px]">
                {selectedFile.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({Math.round(selectedFile.size / 1024)} KB)
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearSelection}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              <p className="font-medium">Upload Error</p>
              <p>{errorMessage}</p>
              <p className="mt-1 text-xs">Please try again or select a different file.</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evidence-title">Title</Label>
              <Input
                id="evidence-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title for this evidence"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence-description">
                Description (Optional)
              </Label>
              <Textarea
                id="evidence-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this evidence shows or proves"
                className="min-h-20"
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Add to Evidence List"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
