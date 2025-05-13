import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTimes, FaImage } from 'react-icons/fa';
import cloudinaryConfig from '../../cloudinary';
import CloudinaryUploadWidget from '../common/CloudinaryUploadWidget';

const ServiceForm = ({ service, stations, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Dining',
    stationId: '',
    stationName: '',
    distanceFromStation: '',
    phoneNumber: '',
    alternativePhone: '',
    email: '',
    rating: 0,
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState('');

  const categories = [
    'Dining',
    'Shopping',
    'Transportation',
    'Accommodation',
    'Medical',
    'Entertainment',
    'Banking',
    'Information',
    'Other'
  ];

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || '',
        description: service.description || '',
        category: service.category || 'Dining',
        stationId: service.stationId || '',
        stationName: service.stationName || '',
        distanceFromStation: service.distanceFromStation || '',
        phoneNumber: service.phoneNumber || '',
        alternativePhone: service.alternativePhone || '',
        email: service.email || '',
        rating: service.rating || 0,
        imageUrl: service.imageUrl || ''
      });
      
      if (service.imageUrl) {
        setPreviewImage(service.imageUrl);
      }
    } else if (stations.length > 0) {
      // Default to first station if creating new service
      setFormData(prev => ({
        ...prev,
        stationId: stations[0].id,
        stationName: stations[0].name
      }));
    }
  }, [service, stations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleImageUpload = (imageUrl) => {
    setPreviewImage(imageUrl);
    setFormData(prev => ({
      ...prev,
      imageUrl: imageUrl
    }));
  };

  const handleRemoveImage = () => {
    setPreviewImage('');
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
  };

  const handleStationChange = (e) => {
    const stationId = e.target.value;
    const selectedStation = stations.find(station => station.id === stationId);
    
    setFormData(prev => ({
      ...prev,
      stationId,
      stationName: selectedStation ? selectedStation.name : ''
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 250) {
      newErrors.description = 'Description should not exceed 250 characters';
    }
    
    if (!formData.stationId) {
      newErrors.stationId = 'Station is required';
    }
    
    if (!formData.distanceFromStation.trim()) {
      newErrors.distanceFromStation = 'Distance is required';
    }
    
    // Validate phone number format if provided, but it's now optional
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (formData.phoneNumber.trim() && !phoneRegex.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }
    
    if (formData.alternativePhone.trim() && !phoneRegex.test(formData.alternativePhone.trim())) {
      newErrors.alternativePhone = 'Invalid phone number format';
    }
    
    // Validate email format if provided, but it's now optional
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cloudinary operation timed out')), 15000)
      );
      
      // Prepare the final data with the image URL
      const finalServiceData = {
        ...formData
      };
      
      // Main Firestore operation with timeout protection
      await Promise.race([
        (async () => {
          if (service) {
            // Update existing service
            const serviceRef = doc(db, 'services', service.id);
            await updateDoc(serviceRef, {
              ...finalServiceData,
              updatedAt: serverTimestamp()
            });
            
            onSave({
              ...finalServiceData,
              id: service.id,
              createdAt: service.createdAt
            });
          } else {
            // Add new service
            const servicesCollection = collection(db, 'services');
            
            // Add explicit type conversion for safe Firestore data
            const safeService = {
              ...finalServiceData,
              title: String(finalServiceData.title || ''),
              description: String(finalServiceData.description || ''),
              category: String(finalServiceData.category || ''),
              stationId: String(finalServiceData.stationId || ''),
              stationName: String(finalServiceData.stationName || ''),
              distanceFromStation: String(finalServiceData.distanceFromStation || ''),
              phoneNumber: String(finalServiceData.phoneNumber || ''),
              alternativePhone: String(finalServiceData.alternativePhone || ''),
              email: String(finalServiceData.email || ''),
              rating: Number(finalServiceData.rating || 0),
              imageUrl: String(finalServiceData.imageUrl || ''),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            console.log('Saving service to Firestore:', safeService);
            const docRef = await addDoc(servicesCollection, safeService);
            console.log('Service saved with ID:', docRef.id);
            
            onSave({
              ...finalServiceData,
              id: docRef.id,
              createdAt: new Date()
            });
          }
        })(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Error saving service:', error);
      if (error.message === 'Cloudinary operation timed out') {
        alert('Operation timed out. Please check your internet connection and try again.');
      } else {
        alert(`Failed to save service: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {service ? 'Edit Service Recommendation' : 'Add New Service Recommendation'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Name of the service"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                maxLength={250}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Detailed information about the service (max 250 characters)"
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/250 characters
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Image
              </label>
              <div className="mt-1 flex items-center">
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Service preview"
                      className="w-32 h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <CloudinaryUploadWidget
                    onImageUpload={handleImageUpload}
                    previewImage={previewImage}
                    onRemoveImage={handleRemoveImage}
                  />
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Recommended: Square image, at least 300x300px
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station <span className="text-red-500">*</span>
              </label>
              <select
                name="stationId"
                value={formData.stationId}
                onChange={handleStationChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.stationId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a station</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              {errors.stationId && (
                <p className="mt-1 text-sm text-red-500">{errors.stationId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance from Station <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="distanceFromStation"
                value={formData.distanceFromStation}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.distanceFromStation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 50m or 1.2km"
              />
              {errors.distanceFromStation && (
                <p className="mt-1 text-sm text-red-500">{errors.distanceFromStation}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">No rating</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Average</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+1234567890 (optional)"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alternative Phone
              </label>
              <input
                type="text"
                name="alternativePhone"
                value={formData.alternativePhone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.alternativePhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Optional secondary contact"
              />
              {errors.alternativePhone && (
                <p className="mt-1 text-sm text-red-500">{errors.alternativePhone}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="contact@example.com (optional)"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : service ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
