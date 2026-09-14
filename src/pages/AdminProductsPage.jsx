import { useEffect, useState } from 'react';
import './AdminProductsPage.css';
import CloudinaryUpload from '../components/CloudinaryUpload/CloudinaryUpload';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4242/api';
  
const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Lunches',
  price: '',
  image_url: '',
  available: true,
};

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/admin/products`
      );

      if (!response.ok) {
        throw new Error('Failed to load products.');
      }

      const data = await response.json();

      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingProduct(null);
  };

  const handleNewProduct = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'Lunches',
      price: product.price ?? '',
      image_url: product.image_url || '',
      available: Boolean(product.available),
    });

    setShowForm(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter the product name.');
      return;
    }

    if (!formData.category.trim()) {
      alert('Please select a category.');
      return;
    }

    if (
      formData.price === '' ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) < 0
    ) {
      alert('Please enter a valid price.');
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingProduct);

      const url = isEditing
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          price: Number(formData.price),
          image_url: formData.image_url.trim(),
          available: formData.available,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${isEditing ? 'update' : 'create'} product.`
        );
      }

      if (isEditing) {
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === data.product.id
              ? data.product
              : product
          )
        );

        alert('Product updated successfully.');
      } else {
        setProducts((currentProducts) => [
          ...currentProducts,
          data.product,
        ]);

        alert('Product created successfully.');
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert(
        err.message ||
          'Unable to save product.'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      const response = await fetch(
        `${API_URL}/products/${product.id}/availability`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            available: !product.available,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          'Failed to update availability.'
        );
      }

      const data = await response.json();

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id
            ? data.product
            : item
        )
      );
    } catch (err) {
      console.error(err);
      alert(
        'Unable to update product availability.'
      );
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);

      const response = await fetch(
        `${API_URL}/products/${product.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to delete product.'
        );
      }

      setProducts((currentProducts) =>
        currentProducts.filter(
          (item) => item.id !== product.id
        )
      );

      alert('Product deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(
        err.message || 'Unable to delete product.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="admin-products-page">
      <div className="admin-products-container">

        <header className="admin-products-header">
          <div>
            <span className="admin-products-eyebrow">
              ADMINISTRATION
            </span>

            <h1>Products</h1>

            <p>
              Manage the products available in the
              Buenisimo menu.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              className="admin-new-product-button"
              onClick={handleNewProduct}
            >
              + New product
            </button>
          )}
        </header>

        {showForm && (
          <section className="admin-product-form-card">

            <div className="admin-product-form-header">
              <div>
                <span className="admin-products-eyebrow">
                  PRODUCT
                </span>

                <h2>
                  {editingProduct
                    ? 'Edit product'
                    : 'New product'}
                </h2>

                <p>
                  {editingProduct
                    ? 'Update the product information below.'
                    : 'Add a new product to the restaurant menu.'}
                </p>
              </div>

              <button
                type="button"
                className="admin-form-close"
                onClick={handleCancelForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form
              className="admin-product-form"
              onSubmit={handleSubmit}
            >
              <div className="admin-form-grid">

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="product-name">
                    Product name
                  </label>

                  <input
                    id="product-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Example: Arepa Reina Pepiada"
                    required
                  />
                </div>

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="product-description">
                    Description
                  </label>

                  <textarea
                    id="product-description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Describe the product..."
                    rows="4"
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="product-category">
                    Category
                  </label>

                  <select
                    id="product-category"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                  >
                    <option value="Breakfasts">
                      Breakfasts
                    </option>

                    <option value="Breakfasts Criollos">
                      Breakfasts Criollos
                    </option>

                    <option value="Lunches">
                      Lunches
                    </option>

                    <option value="Appetizers">
                      Appetizers
                    </option>

                    <option value="Kids">
                      Kids
                    </option>

                    <option value="Desserts">
                      Desserts
                    </option>
                  </select>
                </div>

                <div className="admin-form-field">
                  <label htmlFor="product-price">
                    Price
                  </label>

                  <div className="admin-price-input">
                    <span>$</span>

                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-field admin-form-field-full">
                  <label>
                    Product image
                  </label>

                  <CloudinaryUpload
                    currentImage={formData.image_url}
                    onUpload={(imageUrl) => {
                      setFormData((currentData) => ({
                        ...currentData,
                        image_url: imageUrl,
                      }));
                    }}
                  />
                </div>

                <div className="admin-form-availability">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleFormChange}
                    />

                    <span>
                      Product available for customers
                    </span>
                  </label>
                </div>

              </div>

              <div className="admin-product-form-actions">

                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={handleCancelForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-create-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                      ? 'Save changes'
                      : 'Create product'}
                </button>

              </div>
            </form>
          </section>
        )}

        {loading && (
          <div className="admin-products-state">
            <p>Loading products...</p>
          </div>
        )}

        {!loading && error && (
          <div className="admin-products-state admin-products-error">
            <p>{error}</p>

            <button
              type="button"
              onClick={loadProducts}
            >
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="admin-products-state">
              <p>No products found.</p>
            </div>
          )}

        {!loading &&
          !error &&
          products.length > 0 && (
            <section className="admin-products-table-wrapper">
              <table className="admin-products-table">

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>

                      <td>
                        <div className="admin-product-cell">

                          <div className="admin-product-image">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                              />
                            ) : (
                              <span>BS</span>
                            )}
                          </div>

                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            {product.description && (
                              <p>
                                {product.description}
                              </p>
                            )}
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="admin-category">
                          {product.category}
                        </span>
                      </td>

                      <td>
                        <strong>
                          $
                          {Number(product.price).toFixed(2)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            product.available
                              ? 'admin-status available'
                              : 'admin-status unavailable'
                          }
                        >
                          <span className="admin-status-dot"></span>

                          {product.available
                            ? 'Available'
                            : 'Unavailable'}
                        </span>
                      </td>

                      <td>
                        <div className="admin-product-actions">

                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() =>
                              handleEditProduct(product)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={
                              product.available
                                ? 'admin-action-button danger'
                                : 'admin-action-button success'
                            }
                            onClick={() =>
                              toggleAvailability(product)
                            }
                          >
                            {product.available
                              ? 'Disable'
                              : 'Enable'}
                          </button>

                          <button
                            type="button"
                            className="admin-action-button danger"
                            onClick={() =>
                              handleDeleteProduct(product)
                            }
                            disabled={deletingId === product.id}
                          >
                            {deletingId === product.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </section>
          )}

      </div>
    </main>
  );
}

export default AdminProductsPage;