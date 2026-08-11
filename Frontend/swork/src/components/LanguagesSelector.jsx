import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaGlobe } from 'react-icons/fa';

const LanguagesSelector = ({ value = [], onChange, placeholder = "Search for languages..." }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  
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

  // Handle input change
  useEffect(() => {
    if (inputValue.trim() !== '') {
      searchLanguages(inputValue);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [inputValue]);

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

  const handleSelectLanguage = (language) => {
    if (value.length >= 5) {
      setError('Maximum 5 languages allowed');
      return;
    }

    // Check if language is already selected
    if (!value.some(l => l.toLowerCase() === language.toLowerCase())) {
      const newValue = [...value, language];
      onChange(newValue);
    }
    
    setInputValue('');
    setShowDropdown(false);
  };

  const handleRemoveLanguage = (languageToRemove) => {
    const newValue = value.filter(lang => lang !== languageToRemove);
    onChange(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Enter' && inputValue && suggestions.length > 0) {
      e.preventDefault();
      handleSelectLanguage(suggestions[0]);
    }
  };

  return (
    <div className="relative">
      <div className="space-y-2">
        {/* Selected languages chips */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((language, index) => (
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
              placeholder={value.length < 5 ? placeholder : "Maximum 5 languages selected"}
              className={`w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                value.length >= 5 ? 'bg-gray-100 text-gray-400' : 'bg-white'
              }`}
              disabled={value.length >= 5}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FaGlobe />
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && inputValue.length >= 2 && (
          <div 
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.length === 0 ? (
              <div className="px-4 py-3 text-gray-500">No languages found</div>
            ) : (
              <ul>
                {suggestions.map((language, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectLanguage(language)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                  >
                    {language}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Error message */}
        {error && value.length === 0 && (
          <div className="text-red-500 text-sm mt-1">{error}</div>
        )}

        {/* Languages count */}
        <div className="text-xs text-gray-500 mt-1">
          {value.length}/5 languages selected
        </div>
      </div>
    </div>
  );
};

export default LanguagesSelector;