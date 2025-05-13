import React, { useEffect, useState } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import cloudinaryConfig from '../../cloudinary';

const CloudinaryUploadWidget = ({ onImageUpload, previewImage, onRemoveImage }) => {
  const [cloudinaryWidget, setCloudinaryWidget] = useState(null);

  useEffect(() => {
    // Check if Cloudinary script is already loaded
    if (!document.getElementById('cloudinary-widget-script') && window.cloudinary === undefined) {
      const script = document.createElement('script');
      script.setAttribute('id', 'cloudinary-widget-script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      script.onload = initializeWidget;
      document.body.appendChild(script);
    } else if (window.cloudinary) {
      initializeWidget();
    }

    return () => {
      if (cloudinaryWidget) {
        cloudinaryWidget.destroy();
      }
    };
  }, []);

  const initializeWidget = () => {
    if (window.cloudinary) {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudinaryConfig.cloudName,
          uploadPreset: cloudinaryConfig.uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          maxImageFileSize: 5000000, // 5MB max file size
          styles: {
            palette: {
              window: '#FFFFFF',
              windowBorder: '#90A0B3',
              tabIcon: '#0078FF',
              menuIcons: '#5A616A',
              textDark: '#000000',
              textLight: '#FFFFFF',
              link: '#0078FF',
              action: '#FF620C',
              inactiveTabIcon: '#0E2F5A',
              error: '#F44235',
              inProgress: '#0078FF',
              complete: '#20B832',
              sourceBg: '#E4EBF1'
            }
          }
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            onImageUpload(result.info.secure_url);
          }
        }
      );
      setCloudinaryWidget(widget);
    }
  };

  const openWidget = () => {
    if (cloudinaryWidget) {
      cloudinaryWidget.open();
    } else {
      alert('Cloudinary widget is still loading. Please try again in a moment.');
    }
  };

  return (
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
            onClick={onRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
          >
            <FaTimes size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openWidget}
          className="w-32 h-32 flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50"
        >
          <FaImage className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-xs text-gray-500">
            <p>Upload image</p>
          </div>
        </button>
      )}
    </div>
  );
};

export default CloudinaryUploadWidget;
