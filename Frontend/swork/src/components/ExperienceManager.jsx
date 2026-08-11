import { useState } from 'react';
import { FaPlus, FaTrash, FaPencilAlt } from 'react-icons/fa';

const ExperienceManager = ({ value = [], onChange }) => {
  const [experiences, setExperiences] = useState(value);
  const [showForm, setShowForm] = useState(false);
  const [currentExperience, setCurrentExperience] = useState({
    position: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAddExperience = () => {
    if (!currentExperience.position.trim()) return;
    
    if (editingIndex !== null) {
      // Update existing experience
      const updatedExperiences = [...experiences];
      updatedExperiences[editingIndex] = { ...currentExperience };
      setExperiences(updatedExperiences);
      setEditingIndex(null);
    } else {
      // Add new experience
      setExperiences([...experiences, { ...currentExperience }]);
    }
    
    setCurrentExperience({
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    setShowForm(false);
    onChange([...experiences, { ...currentExperience }]);
  };

  const handleEditExperience = (index) => {
    setCurrentExperience(experiences[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleRemoveExperience = (index) => {
    const updatedExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(updatedExperiences);
    onChange(updatedExperiences);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentExperience(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setShowForm(false);
    setCurrentExperience({
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Experience list */}
      {experiences.length > 0 && (
        <div className="space-y-3">
          {experiences.map((exp, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{exp.position || 'Position Title'}</h3>
                  <p className="text-orange-600 font-medium">{exp.company || 'Company'}</p>
                  <p className="text-gray-600 text-sm">{exp.location || ''}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{exp.startDate || ''} - {exp.endDate || 'Present'}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-gray-700 text-sm">{exp.description || ''}</p>
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleEditExperience(index)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                >
                  <FaPencilAlt size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                >
                  <FaTrash size={12} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add experience button */}
      <button
        type="button"
        onClick={() => {
          setCurrentExperience({
            position: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            description: '',
          });
          setEditingIndex(null);
          setShowForm(true);
        }}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <FaPlus />
        Add Experience
      </button>

      {/* Experience form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            {editingIndex !== null ? 'Edit Experience' : 'Add New Experience'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position/Title *
              </label>
              <input
                type="text"
                name="position"
                value={currentExperience.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g., Software Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                name="company"
                value={currentExperience.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g., Google"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={currentExperience.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g., New York, NY"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="text"
                  name="startDate"
                  value={currentExperience.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g., Jan 2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="text"
                  name="endDate"
                  value={currentExperience.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g., Dec 2022"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={currentExperience.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Describe your responsibilities and achievements..."
              rows="3"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddExperience}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              {editingIndex !== null ? 'Update' : 'Add'} Experience
            </button>
          </div>
        </div>
      )}

      {/* Hidden input to maintain compatibility with form */}
      <input
        type="hidden"
        value={JSON.stringify(experiences)}
        onChange={(e) => onChange(JSON.parse(e.target.value))}
      />
    </div>
  );
};

export default ExperienceManager;