import { useRef, useState } from 'react';

const CLOUD_NAME = 'jh1tbkho';
const UPLOAD_PRESET = 'buenisimo_products';

function CloudinaryUpload({ onUpload, currentImage = '' }) {
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');

    // Verifica se é imagem
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Limite de 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10 MB.');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message ||
            'Unable to upload image.'
        );
      }

      // URL segura retornada pelo Cloudinary
      onUpload(data.secure_url);

    } catch (err) {
      console.error('Cloudinary upload error:', err);

      setError(
        err.message ||
          'Unable to upload image.'
      );
    } finally {
      setUploading(false);

      // Permite selecionar novamente a mesma imagem
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="cloudinary-upload">

      {currentImage && (
        <div className="cloudinary-preview">
          <img
            src={currentImage}
            alt="Product preview"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className="cloudinary-upload-button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading
          ? 'Uploading...'
          : currentImage
            ? 'Change image'
            : 'Upload image'}
      </button>

      {error && (
        <p className="cloudinary-upload-error">
          {error}
        </p>
      )}

      <small className="cloudinary-upload-help">
        JPG, PNG or WebP. Maximum 10 MB.
      </small>

    </div>
  );
}

export default CloudinaryUpload;