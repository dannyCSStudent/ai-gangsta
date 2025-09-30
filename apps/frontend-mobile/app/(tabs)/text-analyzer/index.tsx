'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@repo/supabase';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';

interface AnalysisResult {
  scan_id: string;
  truth_summary: string;
  score: number;
  mismatch_reason: string;
  entities: {
    persons: string[];
    organizations: string[];
    locations: string[];
  };
}

interface SavedAnalysis {
  scan_id: string;
  created_at: string;
  caption: string;
  truth_summary: string;
  score: number;
  mismatch_reason: string;
  entities: {
    persons: string[];
    organizations: string[];
    locations: string[];
  };
}

const getScoreColor = (score: number) => {
  if (score <= 10) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  if (score <= 50) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
  return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-200';
};

const getBaseUrl = () => {
  // Use 10.0.2.2 for Android emulator/device to access host machine's localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3002';
  }
  // Use localhost for web and iOS simulator (which correctly resolves it)
  return 'http://localhost:3002';
};
export default function TextAnalysisPage() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userSession, setUserSession] = useState<any | null>(null);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [latestScanId, setLatestScanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle auth
  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserSession(session);
      } else {
        const { data } = await supabase.auth.signInAnonymously();
        if (data.session) {
          setUserSession(data.session);
        }
      }
    };
    handleAuth();
  }, []);

  // Fetch history + realtime subscription
  useEffect(() => {
  if (!userSession) return;

  let isMounted = true; // for cleanup in async calls

  // --- Fetch initial history ---
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      let query = supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', userSession.user.id)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('caption', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching history:', error);
      } else if (isMounted) {
        setHistory(data as SavedAnalysis[]);
      }
    } catch (err) {
      console.error('Unexpected error fetching history:', err);
    } finally {
      if (isMounted) setHistoryLoading(false);
    }
  };

  fetchHistory();

  // --- Real-time subscription ---
  const subscription = supabase
    .channel('public:scan_results')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'scan_results',
        filter: `user_id=eq.${userSession.user.id}`,
      },
      (payload: any) => {
        if (!isMounted) return;

        // Prepend new history
        setHistory(prev => [payload.new as SavedAnalysis, ...prev]);

        // Auto-display if this is the latest scan
        if (payload.new.scan_id === latestScanId) {
          setResult(payload.new as AnalysisResult);
          setShowResult(true);
          setLoading(false);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'scan_results',
        filter: `user_id=eq.${userSession.user.id}`,
      },
      (payload: any) => {
        if (!isMounted) return;

        // Update existing history item
        setHistory(prev =>
          prev.map(item => (item.scan_id === payload.new.scan_id ? payload.new : item))
        );

        // Auto-display if this is the latest scan
        if (payload.new.scan_id === latestScanId) {
          setResult(payload.new as AnalysisResult);
          setShowResult(true);
          setLoading(false);
        }
      }
    )
    .subscribe();

  // --- Polling for latest scan (only if needed) ---
  const pollLatestScan = async () => {
    if (!latestScanId) return;

    let attempts = 0;
    const maxAttempts = 20;
    const pollInterval = 2000;

    while (attempts < maxAttempts && isMounted) {
      try {
        const response = await fetch(`${getBaseUrl()}/text-scan-results/${latestScanId}`);
        if (response.ok) {
          const data = (await response.json()) as AnalysisResult;
          setResult(data);
          setShowResult(true);
          setLoading(false);
          return;
        } else if (response.status === 202 || response.status === 404) {
          await new Promise(res => setTimeout(res, pollInterval));
        } else {
          const errData = await response.json();
          throw new Error(errData.detail || `Server error: ${response.status}`);
        }
      } catch (err) {
        console.error('Polling failed:', err);
      }
      attempts++;
    }

    if (isMounted) {
      setError('Analysis timed out. Please try again.');
      setShowResult(true);
      setLoading(false);
    }
  };

  pollLatestScan();

  // --- Cleanup ---
  return () => {
    isMounted = false;
    subscription.unsubscribe();
  };
}, [userSession, searchQuery, latestScanId]);


  const handleSubmit = async () => {
    if (!inputText || !userSession) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowResult(false);

    const newScanId = crypto.randomUUID();
    setLatestScanId(newScanId);

    try {
      const response = await fetch(`${getBaseUrl()}/analyze-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, scan_id: newScanId, user_id: userSession.user.id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Server error: ${response.status}`);
      }
      // pollForResults(newScanId);
    } catch (e: unknown) {
      let message = 'An unknown error occurred.';
      if (e instanceof Error) message = e.message;
      console.error('Analysis failed:', e);
      setError(`Analysis failed: ${message}`);
      setLoading(false);
      setShowResult(true);
      Alert.alert('Analysis Failed', `Error: ${message}`);
    }
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
    setError(null);
    setShowResult(false);
  };

  const getEntitiesDisplay = () => {
    if (!result?.entities) return <Text>None found.</Text>;
    const { persons = [], organizations = [], locations = [] } = result.entities;
    if (!persons.length && !organizations.length && !locations.length) return <Text>None found.</Text>;

    return (
      <View>
        {persons.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>People:</Text>
            {persons.map((p, idx) => <Text key={`person-${idx}`} style={{ marginLeft: 8 }}>• {p}</Text>)}
          </View>
        )}
        {organizations.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>Organizations:</Text>
            {organizations.map((o, idx) => <Text key={`org-${idx}`} style={{ marginLeft: 8 }}>• {o}</Text>)}
          </View>
        )}
        {locations.length > 0 && (
          <View>
            <Text style={{ fontWeight: '600' }}>Locations:</Text>
            {locations.map((l, idx) => <Text key={`loc-${idx}`} style={{ marginLeft: 8 }}>• {l}</Text>)}
          </View>
        )}
      </View>
    );
  };

  const handleHistoryItemClick = (analysis: SavedAnalysis) => {
    setInputText(analysis.caption);
    setResult(analysis);
    setShowResult(true);
  };

    return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FAFAFA' }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 600, backgroundColor: 'white', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
          
          <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 }}>Text Truth Scanner</Text>

          {!showResult ? (
            <View style={{ width: '100%' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
                Enter text or paste a news article summary to analyze
              </Text>
              <TextInput
                style={{ width: '100%', minHeight: 120, borderWidth: 1, borderColor: '#D4D4D8', borderRadius: 8, padding: 12, backgroundColor: '#F4F4F5', textAlignVertical: 'top' }}
                multiline
                value={inputText}
                onChangeText={setInputText}
                placeholder="Paste your text here..."
              />
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 16,
                  backgroundColor: loading ? '#93C5FD' : '#2563EB',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Analyzing...</Text>
                  </>
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Analyze Text</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <Text style={{ fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>Analysis Results</Text>
              {error ? (
                <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
              ) : (
                <View style={{ width: '100%' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flex: 1, marginRight: 8, backgroundColor: '#F4F4F5', padding: 16, borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#71717A' }}>Score</Text>
                      <View style={{ marginTop: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, backgroundColor: '#D1FAE5' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10B981' }}>
                          {result?.score !== null && result?.score !== undefined ? `${result?.score.toFixed(1)}%` : 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8, backgroundColor: '#F4F4F5', padding: 16, borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#71717A' }}>Mismatch Reason</Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>{result?.mismatch_reason || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#F4F4F5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#71717A' }}>Summary</Text>
                    <Text style={{ marginTop: 4 }}>{result?.truth_summary || 'N/A'}</Text>
                  </View>

                  <View style={{ backgroundColor: '#F4F4F5', padding: 16, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#71717A' }}>Entities</Text>
                    <View style={{ marginTop: 4 }}>
                      {getEntitiesDisplay()}
                    </View>
                  </View>
                </View>
              )}
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  width: '100%',
                  marginTop: 16,
                  backgroundColor: '#2563EB',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Analyze Another Text</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 2, width: '100%', backgroundColor: '#E5E7EB', marginVertical: 32 }} />

          {/* History Section */}
          <View style={{ width: '100%' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>Your Analysis History</Text>

            <TextInput
              style={{ width: '100%', borderWidth: 1, borderColor: '#D4D4D8', borderRadius: 8, padding: 12, backgroundColor: '#F4F4F5', marginBottom: 16 }}
              placeholder="Search history..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {historyLoading ? (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#71717A" />
                <Text style={{ marginLeft: 8, color: '#71717A' }}>Loading history...</Text>
              </View>
            ) : history.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#71717A', fontStyle: 'italic' }}>No history found. Start by analyzing some text!</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {history.map((item, index) => (
                  <TouchableOpacity
                    key={item.scan_id || `history-${index}`}
                    onPress={() => handleHistoryItemClick(item)}
                    style={{ backgroundColor: '#F4F4F5', padding: 16, borderRadius: 8, marginBottom: 12 }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#404040', textDecorationLine: 'underline' }}>
                      {item.caption}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#71717A', marginTop: 4 }}>
                      Analyzed on: {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}