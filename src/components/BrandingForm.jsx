import React, { useState } from 'react';
import { AlertCircle, Loader, InfoIcon, X } from 'lucide-react';

const InfoTooltip = ({ text }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <InfoIcon
        className="h-4 w-4 ml-2 text-gray-400 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div className="absolute z-50 w-64 px-2 py-1 text-sm text-white bg-gray-900 rounded-lg -top-1 left-6">
          {text}
        </div>
      )}
    </div>
  );
};

const BrandingForm = () => {
  const [formData, setFormData] = useState({
    prefix: '',           
    firstName: '',        
    lastName: '',         
    suffix: 'Team',
    style: '',
    brandTheme: '',
    description: '',
    useAbbreviatedName: false,
    useFirstNameOnly: false,
    useLastNameOnly: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Tooltip content
  const tooltips = {
    firstName: "First and last name is required for compliance purposes",
    lastName: "First and last name is required for compliance purposes",
    teamType: "Required designation for compliance purposes",
    style: "Select a general style for your brand image",
    brandTheme: "Select a primary theme for your brand image",
    prefix: "Optional prefix for your brand name",
    description: "Optional details to customize your image (e.g. a fun and exciting logo with a minimalist blue house iconography in which the text is placed)",
    useFirstNameOnly: "Only your first name will appear in your brand title",
    useLastNameOnly: "Only your last name will appear in your brand title",
    abbreviatedName: "Only available when both first and last names are provided"
  };

  // Brand Theme options
  const brandThemeOptions = [
    { value: 'house', label: 'House Symbol' },
    { value: 'handshake', label: 'Handshake' },
    { value: 'key', label: 'Key Symbol' },
    { value: 'shield', label: 'Shield Icon' },
    { value: 'tree', label: 'Tree Symbol' },
    { value: 'arrow', label: 'Growth Arrow' },
  ];

  // Style options
  const styleOptions = [
    { value: 'professional', label: 'Professional & Corporate' },
    { value: 'modern', label: 'Modern & Minimalist' },
    { value: 'friendly', label: 'Warm & Approachable' },
    { value: 'bold', label: 'Bold & Confident' },
    { value: 'surprise', label: 'Surprise Me' },
    { value: 'eccentric', label: 'Wild & Eccentric' }
  ];

  const handleNameOptionChange = (option) => {
    // Reset other options when one is selected
    const updates = {
      useAbbreviatedName: false,
      useFirstNameOnly: false,
      useLastNameOnly: false
    };
    updates[option] = !formData[option];
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const BrandImage = ({ imageUrl, selected }) => (
    <div className={`relative border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} rounded-lg p-2 transition-all duration-200 hover:border-blue-300 w-full h-full flex items-center justify-center overflow-hidden`}>
      <div className="relative w-[512px] h-[512px] flex items-center justify-center">
        <img 
          src={imageUrl}
          alt="Generated brand"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );

  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(`https://kind-lending-retail.onrender.com/api/download-image?url=${encodeURIComponent(imageUrl)}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brand-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download image. Please try again.');
      console.error('Download error:', error);
    }
  };

  const handleGenerateClick = async () => {
    if (attemptsRemaining === 0) {
      setError('Please try again in 30 minutes');
      return;
    }

    if (!formData.lastName || !formData.suffix || !formData.firstName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://kind-lending-retail.onrender.com/api/generate-brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();
      setGeneratedImages(data.imageUrls);
      setSelectedImageIndex(0);
      setAttemptsRemaining(prev => prev - 1);
      setShowModal(true);
    } catch (err) {
      console.error('Full error:', err);
      setError(`Failed to generate image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAttempt = () => {
    setShowConfirmation(true);
  };

  const handleConfirmClose = () => {
    setShowConfirmation(false);
    setShowModal(false);
    setGeneratedImages([]);
  };

  const handleCancelClose = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-screen-xl mx-auto">
        <img
          src="/Logo.png"
          alt="Kind Lending"
          className="h-[300px] mx-auto object-contain"
        />
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg space-y-8 p-6">
          <div className="text-center space-y-2 border-b border-gray-200 pb-6">
            <p className="text-gray-600">
              Create your professional brand image while maintaining compliance with lending industry standards.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              <AlertCircle className="h-4 w-4 inline-block mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Brand Name Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Brand Name Configuration</h3>
              
              {/* Prefix Selection */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prefix"
                  className="rounded border-gray-300"
                  checked={formData.prefix === 'The'}
                  onChange={(e) => setFormData({
                    ...formData,
                    prefix: e.target.checked ? 'The' : ''
                  })}
                />
                <label htmlFor="prefix" className="flex items-center">
                  Add "The" prefix
                  <InfoTooltip text={tooltips.prefix} />
                </label>
              </div>

              {/* First Name */}
              <div>
                <label className="flex items-center text-sm font-bold mb-1">
                  First Name
                  <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip text={tooltips.firstName} />
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="Enter first name"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold mb-1">
                  Last Name
                  <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip text={tooltips.lastName} />
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Enter last name"
                  required
                />

                {/* Name Display Options */}
                <div className="space-y-2 pl-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="abbreviatedName"
                      checked={formData.useAbbreviatedName}
                      onChange={() => handleNameOptionChange('useAbbreviatedName')}
                      disabled={!formData.firstName || !formData.lastName}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="abbreviatedName" className="flex items-center">
                      Abbreviate Name
                      <InfoTooltip text={tooltips.abbreviatedName} />
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="firstNameOnly"
                      checked={formData.useFirstNameOnly}
                      onChange={() => handleNameOptionChange('useFirstNameOnly')}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="firstNameOnly" className="flex items-center">
                      Only use first name
                      <InfoTooltip text={tooltips.useFirstNameOnly} />
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lastNameOnly"
                      checked={formData.useLastNameOnly}
                      onChange={() => handleNameOptionChange('useLastNameOnly')}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="lastNameOnly" className="flex items-center">
                      Only use last name
                      <InfoTooltip text={tooltips.useLastNameOnly} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Team Type Selection */}
              <div>
                <label className="flex items-center text-sm font-bold mb-1">
                  Team Type
                  <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip text={tooltips.teamType} />
                </label>
                <select
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.suffix}
                  onChange={(e) => setFormData({...formData, suffix: e.target.value})}
                  required
                >
                  <option value="Team">Team</option>
                  <option value="Group">Group</option>
                  <option value="Mortgage Team">Mortgage Team</option>
                  <option value="Mortgage Group">Mortgage Group</option>
                </select>
              </div>
            </div>

            {/* Style Preference */}
            <div>
              <label className="flex items-center text-sm font-bold mb-1">
                Style Preference
                <InfoTooltip text={tooltips.style} />
              </label>
              <select
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.style}
                onChange={(e) => setFormData({...formData, style: e.target.value})}
              >
                <option value="">Select a style...</option>
                {styleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Theme */}
            <div>
              <label className="flex items-center text-sm font-bold mb-1">
                Brand Theme
                <InfoTooltip text={tooltips.brandTheme} />
              </label>
              <select
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.brandTheme}
                onChange={(e) => setFormData({...formData, brandTheme: e.target.value})}
              >
                <option value="">Select a theme...</option>
                {brandThemeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Description */}
            <div>
              <label className="flex items-center text-sm font-bold mb-1">
                Additional Description
                <InfoTooltip text={tooltips.description} />
              </label>
              <textarea
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                maxLength={200}
                rows={3}
                placeholder="Describe your desired brand image (optional)"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">
                Attempts remaining: {attemptsRemaining}
              </span>
              <button
                onClick={handleGenerateClick}
                disabled={loading || attemptsRemaining === 0}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-md disabled:bg-gray-400 transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin mr-2" />
                    Generating...
                  </span>
                ) : (
                  'Generate Brand Image'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 overflow-y-auto p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium text-gray-500">
                Image {selectedImageIndex + 1} of {generatedImages.length}
              </span>
              <button 
                onClick={handleCloseAttempt}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex flex-col items-center px-6 pb-6">
              <div className="relative w-full flex items-center justify-center">
                {/* Left Arrow */}
                <button 
                  onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : prev))}
                  className={`absolute left-0 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 
                    ${selectedImageIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={selectedImageIndex === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Current Image */}
                <div className="w-[512px] h-[512px] flex items-center justify-center">
                  <BrandImage 
                    imageUrl={generatedImages[selectedImageIndex]}
                    selected={true}
                  />
                </div>

                {/* Right Arrow */}
                <button 
                  onClick={() => setSelectedImageIndex((prev) => (prev < generatedImages.length - 1 ? prev + 1 : prev))}
                  className={`absolute right-0 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100
                    ${selectedImageIndex === generatedImages.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={selectedImageIndex === generatedImages.length - 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Download Button */}
              <div className="w-full max-w-md space-y-4 mt-4">
                <button
                  onClick={() => handleDownload(generatedImages[selectedImageIndex])}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-400"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                    />
                  </svg>
                  Download Selected Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to exit?
            </h3>
            <p className="text-gray-600 mb-6">
              You will lose access to all generated images.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                NO, KEEP VIEWING
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                YES, EXIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandingForm;