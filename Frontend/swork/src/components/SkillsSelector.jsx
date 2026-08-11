import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaSearch, FaCode } from 'react-icons/fa';

const SkillsSelector = ({ value = [], onChange, placeholder = "Search for skills..." }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search function
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

  // Handle input change with debounce
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      searchSkills(inputValue);
    }, 400);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
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

  const handleSelectSkill = (skill) => {
    if (value.length >= 15) {
      setError('Maximum 15 skills allowed');
      return;
    }

    // Check if skill is already selected
    if (!value.some(s => s.toLowerCase() === skill.toLowerCase())) {
      const newValue = [...value, skill];
      onChange(newValue);
    }
    
    setInputValue('');
    setShowDropdown(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newValue = value.filter(skill => skill !== skillToRemove);
    onChange(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Enter' && inputValue && suggestions.length > 0) {
      e.preventDefault();
      handleSelectSkill(suggestions[0].preferredLabel);
    }
  };

  return (
    <div className="relative">
      <div className="space-y-2">
        {/* Selected skills chips */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((skill, index) => (
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

        {/* Input field */}
        <div className="relative" ref={inputRef}>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              placeholder={value.length < 15 ? placeholder : "Maximum 15 skills selected"}
              className={`w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                value.length >= 15 ? 'bg-gray-100 text-gray-400' : 'bg-white'
              }`}
              disabled={value.length >= 15}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FaCode />
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
              <div className="px-4 py-3 text-gray-500">Searching skills...</div>
            ) : error ? (
              <div className="px-4 py-3 text-red-500">{error}</div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-gray-500">No skills found</div>
            ) : (
              <ul>
                {suggestions.map((skill, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectSkill(skill.preferredLabel)}
                    className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                  >
                    {skill.preferredLabel}
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

        {/* Skills count */}
        <div className="text-xs text-gray-500 mt-1">
          {value.length}/15 skills selected
        </div>
      </div>
    </div>
  );
};

export default SkillsSelector;