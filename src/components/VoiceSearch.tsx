"use client";

import { useState, useRef, useEffect } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  onFiltersDetected?: (filters: VoiceFilters) => void;
  placeholder?: string;
}

interface VoiceFilters {
  category?: string;
  location?: string;
  priceRange?: 'free' | 'paid' | 'any';
  nearby?: boolean;
  college?: string;
  date?: string;
}

// Command patterns for natural language understanding
const COMMAND_PATTERNS = {
  nearby: /\b(nearby|near me|close|around here|local)\b/i,
  free: /\b(free|no cost|complimentary|without charge)\b/i,
  paid: /\b(paid|premium|ticketed)\b/i,
  categories: {
    technical: /\b(tech|technical|coding|hackathon|workshop|seminar)\b/i,
    cultural: /\b(cultural|fest|culture|traditional|dance|music)\b/i,
    sports: /\b(sports|athletic|game|tournament|match)\b/i,
    social: /\b(social|party|networking|meetup)\b/i,
  },
  dateKeywords: {
    today: /\b(today|tonight)\b/i,
    tomorrow: /\b(tomorrow)\b/i,
    thisWeek: /\b(this week|upcoming)\b/i,
    weekend: /\b(weekend|saturday|sunday)\b/i,
  },
  colleges: /\b(at|in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+college\b/i,
};

export function VoiceSearch({ onSearch, onFiltersDetected, placeholder = "Search events..." }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("en-US");
  const recognitionRef = useRef<any>(null);

  // Parse voice command and extract filters
  const parseVoiceCommand = (text: string): { query: string; filters: VoiceFilters } => {
    const filters: VoiceFilters = {};
    let processedQuery = text;

    // Check for nearby
    if (COMMAND_PATTERNS.nearby.test(text)) {
      filters.nearby = true;
      processedQuery = processedQuery.replace(COMMAND_PATTERNS.nearby, '').trim();
    }

    // Check for price
    if (COMMAND_PATTERNS.free.test(text)) {
      filters.priceRange = 'free';
      processedQuery = processedQuery.replace(COMMAND_PATTERNS.free, '').trim();
    } else if (COMMAND_PATTERNS.paid.test(text)) {
      filters.priceRange = 'paid';
      processedQuery = processedQuery.replace(COMMAND_PATTERNS.paid, '').trim();
    }

    // Check for categories
    for (const [category, pattern] of Object.entries(COMMAND_PATTERNS.categories)) {
      if (pattern.test(text)) {
        filters.category = category;
        break;
      }
    }

    // Check for date keywords
    for (const [dateType, pattern] of Object.entries(COMMAND_PATTERNS.dateKeywords)) {
      if (pattern.test(text)) {
        filters.date = dateType;
        processedQuery = processedQuery.replace(pattern, '').trim();
        break;
      }
    }

    // Check for college name
    const collegeMatch = text.match(COMMAND_PATTERNS.colleges);
    if (collegeMatch) {
      filters.college = collegeMatch[2];
      processedQuery = processedQuery.replace(COMMAND_PATTERNS.colleges, '').trim();
    }

    // Remove filler words
    processedQuery = processedQuery
      .replace(/\b(show me|find|search for|events?|happening)\b/gi, '')
      .trim();

    return { query: processedQuery, filters };
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setTranscript("");
        };

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptText = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              setTranscript(transcriptText);
              
              // Parse the command
              const { query, filters } = parseVoiceCommand(transcriptText);
              
              // Notify about detected filters
              if (onFiltersDetected && Object.keys(filters).length > 0) {
                onFiltersDetected(filters);
                toast.success("Voice filters applied!", {
                  description: Object.entries(filters)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')
                });
              }
              
              // Perform search with processed query
              onSearch(query || transcriptText);
              
            } else {
              interimTranscript += transcriptText;
            }
          }

          if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          
          if (event.error === 'no-speech') {
            toast.error("No speech detected. Please try again.");
          } else if (event.error === 'not-allowed') {
            toast.error("Microphone access denied. Please enable microphone permissions.");
          } else {
            toast.error(`Speech recognition error: ${event.error}`);
          }
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
  }, [onSearch, onFiltersDetected, language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice search not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        toast.info("Listening... Try: 'Show nearby free technical events'");
      } catch (error) {
        console.error("Failed to start recognition:", error);
        toast.error("Failed to start voice search");
      }
    }
  };

  const toggleLanguage = () => {
    const newLang = language === "en-US" ? "hi-IN" : "en-US";
    setLanguage(newLang);
    
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang;
    }
    
    toast.success(`Language switched to ${newLang === "en-US" ? "English" : "Hindi"}`);
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
        title={isListening ? "Stop listening" : "Start voice search"}
      >
        <Icons.Mic className="h-5 w-5" />
      </button>
      
      <button
        onClick={toggleLanguage}
        className="px-2 py-1 text-xs rounded hover:bg-bg-muted text-text-secondary"
        title="Switch language"
      >
        {language === "en-US" ? "EN" : "HI"}
      </button>
      
      {transcript && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary truncate max-w-xs">
            {transcript}
          </span>
          {isListening && (
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-red-500 animate-pulse rounded" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-3 bg-red-500 animate-pulse rounded" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-3 bg-red-500 animate-pulse rounded" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
