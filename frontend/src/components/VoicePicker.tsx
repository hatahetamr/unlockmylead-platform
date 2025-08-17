import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ApiService from '../services/api';
import './VoicePicker.css';

interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'MALE' | 'FEMALE';
  type: 'Standard' | 'WaveNet' | 'Neural2';
  accent: string;
  style: string;
  isPremium: boolean;
}

interface VoicePickerProps {
  selectedVoice?: string;
  onVoiceSelect: (voiceId: string) => void;
  language?: string;
}

const VoicePicker: React.FC<VoicePickerProps> = ({
  selectedVoice,
  onVoiceSelect,
  language = 'en'
}) => {
  const { t } = useTranslation();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('popular');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [voices, searchQuery, filterGender, filterType, activeCategory, language]);

  const loadVoices = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getVoices();
      setVoices(response.voices);
    } catch (error: any) {
      setError(error.message || 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = voices;

    // Filter by category
    if (activeCategory === 'popular') {
      filtered = voices.filter(voice => 
        ['en-US-Wavenet-D', 'en-US-Wavenet-F', 'en-GB-Wavenet-A', 'es-ES-Wavenet-B'].includes(voice.id)
      );
    } else if (activeCategory === 'premium') {
      filtered = voices.filter(voice => voice.isPremium);
    } else if (activeCategory === 'language') {
      filtered = voices.filter(voice => voice.language.startsWith(language));
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(voice =>
        voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voice.accent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voice.style.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(voice => voice.gender === filterGender.toUpperCase());
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(voice => voice.type === filterType);
    }

    setFilteredVoices(filtered);
  };

  const playVoicePreview = async (voiceId: string) => {
    try {
      if (playingVoice === voiceId) {
        // Stop current playback
        const audio = audioElements.get(voiceId);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingVoice(null);
        return;
      }

      // Stop any currently playing audio
      if (playingVoice) {
        const currentAudio = audioElements.get(playingVoice);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      setPlayingVoice(voiceId);

      // Check if we already have this audio element
      let audio = audioElements.get(voiceId);
      if (!audio) {
        // Generate preview
        const audioBlob = await ApiService.getVoicePreview(voiceId, language);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audio = new Audio(audioUrl);
        audio.onended = () => setPlayingVoice(null);
        audio.onerror = () => {
          setPlayingVoice(null);
          console.error('Audio playback failed');
        };
        
        const newAudioElements = new Map(audioElements);
        newAudioElements.set(voiceId, audio);
        setAudioElements(newAudioElements);
      }

      await audio.play();
    } catch (error) {
      console.error('Failed to play voice preview:', error);
      setPlayingVoice(null);
    }
  };

  const getVoiceTypeIcon = (type: string) => {
    switch (type) {
      case 'Neural2': return '🧠';
      case 'WaveNet': return '🌊';
      default: return '🔊';
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'MALE' ? '👨' : '👩';
  };

  if (loading) {
    return (
      <div className="voice-picker-loading">
        <div className="loading-spinner"></div>
        <p>Loading voices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="voice-picker-error">
        <p>Error: {error}</p>
        <button onClick={loadVoices} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="voice-picker">
      <div className="voice-picker-header">
        <h3>Choose AI Voice</h3>
        <p>{filteredVoices.length} voices available</p>
      </div>

      {/* Category Tabs */}
      <div className="voice-categories">
        <button
          className={`category-tab ${activeCategory === 'popular' ? 'active' : ''}`}
          onClick={() => setActiveCategory('popular')}
        >
          ⭐ Popular
        </button>
        <button
          className={`category-tab ${activeCategory === 'premium' ? 'active' : ''}`}
          onClick={() => setActiveCategory('premium')}
        >
          💎 Premium
        </button>
        <button
          className={`category-tab ${activeCategory === 'language' ? 'active' : ''}`}
          onClick={() => setActiveCategory('language')}
        >
          🌍 By Language
        </button>
        <button
          className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          📋 All Voices
        </button>
      </div>

      {/* Search and Filters */}
      <div className="voice-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search voices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="all">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Standard">Standard</option>
            <option value="WaveNet">WaveNet</option>
            <option value="Neural2">Neural2</option>
          </select>
        </div>
      </div>

      {/* Voice Grid */}
      <div className="voice-grid">
        {filteredVoices.map((voice) => (
          <div
            key={voice.id}
            className={`voice-card ${selectedVoice === voice.id ? 'selected' : ''} ${voice.isPremium ? 'premium' : ''}`}
            onClick={() => onVoiceSelect(voice.id)}
          >
            <div className="voice-card-header">
              <div className="voice-info">
                <span className="voice-icon">
                  {getGenderIcon(voice.gender)} {getVoiceTypeIcon(voice.type)}
                </span>
                <div className="voice-details">
                  <h4>{voice.name}</h4>
                  <p className="voice-accent">{voice.accent}</p>
                </div>
              </div>
              {voice.isPremium && <span className="premium-badge">PRO</span>}
            </div>
            
            <div className="voice-meta">
              <span className="voice-type">{voice.type}</span>
              <span className="voice-style">{voice.style}</span>
            </div>

            <div className="voice-actions">
              <button
                className={`play-btn ${playingVoice === voice.id ? 'playing' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  playVoicePreview(voice.id);
                }}
              >
                {playingVoice === voice.id ? '⏸️' : '▶️'}
              </button>
              {selectedVoice === voice.id && (
                <span className="selected-indicator">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <div className="no-voices">
          <p>No voices found matching your criteria.</p>
          <button onClick={() => {
            setSearchQuery('');
            setFilterGender('all');
            setFilterType('all');
            setActiveCategory('popular');
          }}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default VoicePicker;
