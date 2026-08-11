import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaSearch, FaGlobe, FaCode } from 'react-icons/fa';

const SkillsLanguagesSelector = ({ 
  skillsValue = [], 
  languagesValue = [], 
  onSkillsChange, 
  onLanguagesChange,
  skillsPlaceholder = "Search for skills...",
  languagesPlaceholder = "Search for languages..."
}) => {
  const [inputType, setInputType] = useState('skills'); // 'skills' or 'languages'
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Common languages list
  const commonLanguages = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Russian", "Portuguese", 
    "Italian", "Arabic", "Hindi", "Korean", "Dutch", "Turkish", "Polish", "Swedish", 
    "Norwegian", "Danish", "Finnish", "Greek", "Czech", "Romanian", "Hungarian", "Bulgarian",
    "Croatian", "Slovak", "Slovenian", "Estonian", "Latvian", "Lithuanian", "Ukrainian",
    "Serbian", "Bosnian", "Macedonian", "Albanian", "Maltese", "Irish", "Welsh"
  ];

  // Debounced search function for skills
  const searchSkills = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Using ESCO Skills API
      const response = await fetch(
        `https://ec.europa.eu/esco/api/search?type=skill&text=${encodeURIComponent(query)}&size=15`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      
      const data = await response.json();
      
      // Extract skills from the API response
      const skills = Array.isArray(data._embedded?.results) 
        ? data._embedded.results.map(skill => ({
            preferredLabel: skill.preferredLabel?.en || skill.preferredLabel?.[Object.keys(skill.preferredLabel)[0]] || skill.uri,
            uri: skill.uri,
            type: skill.type
          }))
        : [];
      
      setSuggestions(skills);
    } catch (err) {
      setError('Failed to load skills. Please try again.');
      console.error('Skills API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search function for languages
  const searchLanguages = (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const filteredLanguages = commonLanguages.filter(lang => 
      lang.toLowerCase().includes(query.toLowerCase())
    );
    
    setSuggestions(filteredLanguages);
  };

  // Handle input change with debounce
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (inputValue.trim() !== '') {
      const timer = setTimeout(() => {
        if (inputType === 'skills') {
          searchSkills(inputValue);
        } else {
          searchLanguages(inputValue);
        }
      }, 400);

      setDebounceTimer(timer);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [inputValue, inputType]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setShowDropdown(true);
  };

  const handleSelectItem = (item) => {
    if (inputType === 'skills') {
      if (skillsValue.length >= 15) {
        setError('Maximum 15 skills allowed');
        return;
      }

      // Check if skill is already selected
      if (!skillsValue.some(s => s.toLowerCase() === item.toLowerCase())) {
        onSkillsChange([...skillsValue, item]);
      }
    } else {
      if (languagesValue.length >= 5) {
        setError('Maximum 5 languages allowed');
        return;
      }

      // Check if language is already selected
      if (!languagesValue.some(l => l.toLowerCase() === item.toLowerCase())) {
        onLanguagesChange([...languagesValue, item]);
      }
    }
    
    setInputValue('');
    setShowDropdown(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newValue = skillsValue.filter(skill => skill !== skillToRemove);
    onSkillsChange(newValue);
  };

  const handleRemoveLanguage = (languageToRemove) => {
    const newValue = languagesValue.filter(lang => lang !== languageToRemove);
    onLanguagesChange(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Enter' && inputValue && suggestions.length > 0) {
      e.preventDefault();
      handleSelectItem(suggestions[0].preferredLabel || suggestions[0]);
    }
  };

  const toggleInputType = (type) => {
    setInputType(type);
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Type toggle buttons */}
      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleInputType('skills')}
          className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
            inputType === 'skills'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FaCode className={inputType === 'skills' ? 'text-white' : 'text-orange-500'} />
          Skills
        </button>
        <button
          type="button"
          onClick={() => toggleInputType('languages')}
          className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
            inputType === 'languages'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FaGlobe className={inputType === 'languages' ? 'text-white' : 'text-orange-500'} />
          Languages
        </button>
      </div>

      <div className="space-y-4">
        {/* Selected skills chips */}
        {inputType === 'skills' && skillsValue.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skillsValue.map((skill, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-orange-600 hover:text-orange-800 focus:outline-none"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected languages chips */}
        {inputType === 'languages' && languagesValue.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {languagesValue.map((language, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{language}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(language)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input field */}
        <div className="relative" ref={inputRef}>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              placeholder={
                inputType === 'skills' 
                  ? skillsValue.length < 15 ? skillsPlaceholder : "Maximum 15 skills selected"
                  : languagesValue.length < 5 ? languagesPlaceholder : "Maximum 5 languages selected"
              }
              className={`w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                (inputType === 'skills' && skillsValue.length >= 15) || 
                (inputType === 'languages' && languagesValue.length >= 5)
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white'
              }`}
              disabled={
                (inputType === 'skills' && skillsValue.length >= 15) || 
                (inputType === 'languages' && languagesValue.length >= 5)
              }
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FaSearch />
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && inputValue.length >= 2 && (
          <div 
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {isLoading ? (
              <div className="px-4 py-3 text-gray-500">Searching {inputType}...</div>
            ) : error ? (
              <div className="px-4 py-3 text-red-500">{error}</div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-gray-500">No {inputType} found</div>
            ) : (
              <ul>
                {suggestions.map((item, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectItem(typeof item === 'string' ? item : item.preferredLabel)}
                    className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                  >
                    {typeof item === 'string' ? item : item.preferredLabel}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm mt-1">{error}</div>
        )}

        {/* Count */}
        <div className="text-xs text-gray-500 mt-1">
          {inputType === 'skills' 
            ? `${skillsValue.length}/15 skills selected`
            : `${languagesValue.length}/5 languages selected`
          }
        </div>
      </div>
    </div>
  );
};

export default SkillsLanguagesSelector;