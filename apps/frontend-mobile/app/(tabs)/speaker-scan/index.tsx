import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";

function dataURLtoFile(dataUrl: string, filename: string) {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

const getBaseUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3002";
  if (Platform.OS === "web") return "http://localhost:3002";
  return "http://localhost:3002"; // Adjust if running on physical device
};

export default function SmartSpeakerScanCard() {
  const [transcript, setTranscript] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Debug: check what you got
      console.log("Picked file:", result.assets[0]);

      uploadAudio(result.assets[0]);
    }
  };

  const uploadAudio = async (file: any) => {
    setLoading(true);
    setTranscript("Analyzing speaker in real time...");
    setSpeaker("");
    setConfidence(null);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        if (typeof file.uri === "string" && file.uri.startsWith("data:")) {
          // Base64 data URI on web, convert to File
          const realFile = dataURLtoFile(file.uri, file.name || "audio.mp3");
          formData.append("file", realFile);
        } else if (file instanceof File) {
          // Already a File object
          formData.append("file", file);
        } else if (file.file) {
          // Some versions might have file.file
          formData.append("file", file.file);
        } else {
          throw new Error("Unrecognized web file format");
        }
      } else {
        // Native platforms expect {uri, name, type}
        if (!file.uri) {
          throw new Error("Native file object missing uri");
        }
        let fileUri = file.uri;
        if (Platform.OS === "android" && !fileUri.startsWith("file://")) {
          fileUri = "file://" + fileUri;
        }
        formData.append("file", {
          uri: fileUri,
          name: file.name || "audio.mp3",
          type: file.mimeType || "audio/mpeg",
        } as any);
      }

      const response = await fetch(`${getBaseUrl()}/generate_transcription/stream`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "text/event-stream",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      // SSE streaming parse
      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          if (event.startsWith("data:")) {
            const data = event.replace(/^data:\s*/, "").trim();

            if (data === "[DONE]") {
              setLoading(false);
              return;
            }

            if (data.startsWith("Quick Transcript:")) {
              setTranscript(data.replace("Quick Transcript:", "").trim());
            } else if (data.startsWith("Author:")) {
              const match = data.match(/Author:\s(.+)\s\(([\d.]+)%\)/);
              if (match) {
                setSpeaker(match[1]);
                setConfidence(parseFloat(match[2]) / 100);
              }
            } else {
              setTranscript((prev) => prev + " " + data);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setTranscript("Upload failed or server error.");
      setLoading(false);
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-md w-full max-w-md mx-auto">
      <Text className="text-xl font-bold mb-2">Smart Speaker Scan</Text>

      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#4B9CD3" />
          <Text className="mt-2">{transcript}</Text>
        </View>
      ) : (
        <>
          {transcript ? (
            <>
              <Text className="text-gray-800 mt-2">{transcript}</Text>
              {speaker ? (
                <Text className="mt-2 font-semibold text-blue-600">
                  🎤 {speaker} ({Math.round((confidence ?? 0) * 100)}%)
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="text-gray-500 mb-4">
              Upload an audio file to analyze the speaker.
            </Text>
          )}
        </>
      )}

      <TouchableOpacity
        onPress={pickAudio}
        className="mt-4 bg-blue-600 py-2 px-4 rounded-xl"
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? "Analyzing..." : "Upload Audio"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
