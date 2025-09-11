'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'

// Define a new interface for the modal's props to fix the TypeScript errors.
interface ModalProps {
  message: string;
  onClose: () => void;
}

/**
 * Interface for the response data from the backend API.
 * Defines the data structure for a single analysis result.
 */
interface AnalyzeResponse {
  truth_summary: string;
  mismatch_reason: string;
  score: number;
  scan_id: string;
  status: string;
}

/**
 * A simple modal component to display messages to the user.
 * @param message The message to display.
 * @param onClose The function to call when the modal is closed.
 */
const CustomModal: React.FC<ModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-70">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Notice</h2>
        <p className="text-zinc-700 dark:text-zinc-300">{message}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-300"
        >
          OK
        </button>
      </div>
    </div>
  );
};

/**
 * Renders the Post-Truth Scanner page for the web application.
 * It allows users to upload a media file and a caption, and get an AI-powered analysis.
 */
export default function App() {
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);

  /**
   * Defines the base URL for the API, specific to the web environment.
   */
  const getBaseUrl = () => "http://localhost:3002";

  /**
   * Handles the file selection event from the file input element.
   * @param event The change event from the file input.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setScanId(null);
    }
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
    setScanId(null);

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("media", selectedFile);

    try {
      const response = await fetch(`${getBaseUrl()}/analyze-post`, {
        method: "POST",
        body: formData,
      });

      if (response.status !== 202) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setScanId(data.scan_id);
    } catch (e: unknown) {
      let message = "An unknown error occurred.";
      if (e instanceof Error) {
        message = e.message;
      }
      console.error("Analysis failed:", e);
      setError(`Analysis failed: ${message}`);
      setLoading(false);
    }
  };

  /**
   * Polls the backend for the analysis result using the scan_id.
   */
  useEffect(() => {
    let interval: number | null = null;
    const checkStatus = async () => {
      if (!scanId) return;

      try {
        const response = await fetch(`${getBaseUrl()}/scan-results/${scanId}`);

        if (response.status === 200) {
          const data = await response.json();
          setResult(data as AnalyzeResponse);
          setLoading(false);
          if (interval) clearInterval(interval);
        } else if (response.status === 202) {
          // The job is still pending, do nothing and let the next poll happen
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Server error: ${response.status}`);
        }
      } catch (e: unknown) {
        let message = "An unknown error occurred.";
        if (e instanceof Error) {
          message = e.message;
        }
        console.error("Polling failed:", e);
        setError(`Polling failed: ${message}`);
        setLoading(false);
        if (interval) clearInterval(interval);
      }
    };

    if (scanId) {
      interval = setInterval(checkStatus, 3000); // Poll every 3 seconds
    }

    // Cleanup function to clear the interval when the component unmounts or scanId changes
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanId]);


  /**
   * Renders the media preview.
   */
  const renderMediaPreview = () => {
    if (!selectedFile) return null;
    const fileUrl = URL.createObjectURL(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      return (
        <Image
          src={fileUrl}
          alt="Media preview"
          className="w-full h-48 object-contain rounded-lg mt-4 border border-zinc-200 dark:border-zinc-700"
        />
      );
    } else if (selectedFile.type.startsWith("video/")) {
      return (
        <div className="w-full h-48 rounded-lg mt-4 bg-zinc-200 dark:bg-zinc-800 flex justify-center items-center relative">
          <video
            src={fileUrl}
            className="w-full h-full object-contain rounded-lg"
          />
          <div className="absolute text-white text-4xl opacity-75">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
              <path d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
            </svg>
          </div>
        </div>
      );
    }
    return null;
  };

  /**
   * Gets the color for the score text based on the score value.
   */
  const getScoreColor = (score?: number) => {
    if (score === undefined) return "text-zinc-500 dark:text-zinc-500";
    if (score >= 90) return "text-red-600 dark:text-red-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
      {/* Main Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl w-full max-w-md mx-auto my-4">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
          Post-Truth Scanner
        </h1>

        <input
          type="text"
          placeholder="Enter a caption for the media..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 mb-4 text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500"
        />

        <label htmlFor="media-upload" className="block w-full cursor-pointer">
          <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-800 border-dashed items-center mb-4 text-center">
            <p className="text-blue-600 dark:text-blue-400 font-semibold">
              {selectedFile ? selectedFile.name : "Select Image or Video"}
            </p>
          </div>
          <input
            id="media-upload"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {renderMediaPreview()}

        <button
          onClick={handleAnalyze}
          className={`w-full py-3 px-6 rounded-xl mt-6 transition-colors duration-300 ${
            loading || !selectedFile
              ? "bg-blue-300 dark:bg-blue-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          }`}
          disabled={loading || !selectedFile}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <p className="text-white text-center font-semibold text-base">
              Analyze Post
            </p>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 font-semibold">Error:</p>
            <p className="text-red-500 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}

        {(result || scanId) && (
          <div className="mt-6 p-6 rounded-lg bg-white dark:bg-zinc-900 shadow-lg border border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Analysis Results
            </h2>
            {loading ? (
              <p className="text-zinc-500 dark:text-zinc-400">Analysis in progress...</p>
            ) : (
              <>
                <p className={`text-2xl font-bold ${getScoreColor(result?.score)} mb-4`}>
                  Score: {result?.score?.toFixed(1) || "N/A"}
                </p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-2">
                  Truth Summary:
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">{result?.truth_summary || "..."}</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-4">
                  Mismatch Reason:
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">{result?.mismatch_reason || "..."}</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-4">
                  Scan ID:
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">{result?.scan_id || scanId}</p>
              </>
            )}
          </div>
        )}
      </div>

      {showModal && <CustomModal message={modalMessage} onClose={() => setShowModal(false)} />}
    </div>
  );
}
