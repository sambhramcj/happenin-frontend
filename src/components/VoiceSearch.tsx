"use client";

import { useState, useRef, useEffect } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function VoiceSearch({ onSearch, placeholder = "Search events..." }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setTranscript("");
        };

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              setTranscript(transcript);
              onSearch(transcript);
            } else {
              interimTranscript += transcript;
            }
          }

          if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          toast.error(`Speech recognition error: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onSearch]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice search not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  const isSupported = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleListening}
        className={`p-2 rounded-lg transition-all ${
          isListening
            ? "bg-red-500/20 text-red-500 animate-pulse"
            : "hover:bg-bg-muted text-text-secondary"
        }`}
        title="Start voice search"
      >
        <Icons.Mic className="h-5 w-5" />
      </button>
      {transcript && (
        <span className="text-sm text-text-secondary truncate max-w-xs">
          {transcript}
        </span>
      )}
    </div>
  );
}
