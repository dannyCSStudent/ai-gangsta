import React, { useState } from "react";
import { Platform } from "react-native";

// Define a simple interface for the response data, as a type check for the app's state.
interface AnalyzeResponse {
  truth_summary: string;
  mismatch_reason: string;
  score: number;
}

/**
 * A screen component for the Post-Truth Scanner.
 * It allows users to upload a media file and a caption, and get an analysis.
 */
const App = () => {
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const getBaseUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3002";
  if (Platform.OS === "web") return "http://localhost:3002";
  return "http://localhost:3002";
};

  /**
   * Handles the file selection from the user's file input.
   * @param event The change event from the file input element.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
    setResult(null);
    setSubmissionStatus(null);
  };

  /**
   * Submits the caption and selected media to the backend for analysis.
   */
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setModalMessage("Please select an image or video to analyze.");
      setShowModal(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setSubmissionStatus(null);

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("media", selectedFile);

    try {
      const response = await fetch(`${getBaseUrl()}/analyze-post`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server error: ${response.status}`);
      }

      setSubmissionStatus(`Analysis job submitted with ID: ${data.scan_id}.`);
    } catch (e: unknown) {
      let message = "An unknown error occurred.";
      if (e instanceof Error) {
        message = e.message;
      }
      console.error("Analysis failed:", e);
      setError(`Analysis failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renders a preview of the selected media file.
   */
  const renderMediaPreview = () => {
    if (!selectedFile) return null;

    const fileUrl = URL.createObjectURL(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      return (
        <img src={fileUrl} alt="Selected Media" className="w-full h-48 rounded-lg mt-4 object-contain" />
      );
    } else if (selectedFile.type.startsWith("video/")) {
      return (
        <div className="w-full h-48 rounded-lg mt-4 bg-gray-200 flex justify-center items-center">
          <p className="text-gray-500 text-lg">Video Selected</p>
        </div>
      );
    }
    return null;
  };

  /**
   * Gets the color for the score text based on the score value.
   */
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-md mx-auto my-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          Post-Truth Scanner
        </h1>

        <input
          type="text"
          placeholder="Enter a caption for the media..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label
          htmlFor="file-input"
          className="block w-full bg-blue-100 rounded-lg p-3 border-2 border-blue-200 border-dashed text-center mb-4 cursor-pointer"
        >
          <span className="text-blue-600 font-semibold">
            {selectedFile ? selectedFile.name : "Select Image or Video"}
          </span>
        </label>
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileChange}
        />

        {renderMediaPreview()}

        <button
          onClick={handleAnalyze}
          className={`w-full py-3 px-6 rounded-xl mt-6 font-semibold text-base transition-colors duration-200 ${
            loading || !selectedFile ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading || !selectedFile}
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <p className="text-white text-center">Analyze Post</p>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-100 border border-red-200">
            <p className="text-red-600 font-semibold">Error:</p>
            <p className="text-red-500 mt-1">{error}</p>
          </div>
        )}

        {submissionStatus && (
          <div className="mt-4 p-4 rounded-lg bg-green-100 border border-green-200">
            <p className="text-green-600 font-semibold">Success:</p>
            <p className="text-green-500 mt-1">{submissionStatus}</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl w-80">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Notice</h2>
              <p className="text-gray-700">{modalMessage}</p>
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 w-full bg-blue-600 rounded-lg p-3 text-white text-center font-semibold hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;


