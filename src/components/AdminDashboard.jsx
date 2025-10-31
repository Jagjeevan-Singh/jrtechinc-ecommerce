import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
// --- CONFIGURATION ---
const API_URL = "http://localhost:3000/api/products";
const ADMIN_USER = "admin";
const ADMIN_PASS = "pnIcdt2FjeQckSvqO6G7LnjgcBx1"; // Mock password matches Firebase ID
// --- ICONS (Using guaranteed HTML entities/text symbols) ---
const ICONS = {
    Edit: '✎',
    Trash: '🗑️',
    Plus: '➕',
    Save: '💾',
    Cancel: '✖',
    Logout: '🚪',
    Package: '📦',
    Image: '🖼️',
    Price: '₹',
    Stock: '📦'
};

// --- HELPER COMPONENTS ---

// 1. Simple Notification component
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    
    return (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white shadow-xl z-50 ${bgColor}`}>
            <div className="flex items-center">
                <span className="mr-2 font-bold">{type === 'error' ? '❗' : '✔'}</span>
                <span>{message}</span>
                <button onClick={onClose} className="ml-4 font-bold">
                    {ICONS.Cancel}
                </button>
            </div>
        </div>
    );
};

// 2. Dynamic Input for Arrays
const ArrayEditor = ({ label, items, onChange, structure, canAdd = true }) => {
    const handleItemChange = (index, key, value) => {
        const newItems = items.map((item, i) => (
            i === index ? { ...item, [key]: value } : item
        ));
        onChange(newItems);
    };

    const handleAddItem = () => {
        const newItem = structure.reduce((acc, field) => {
            acc[field.key] = field.type === 'number' ? 0 : '';
            return acc;
        }, {});
        onChange([...items, newItem]);
    };

    const handleRemoveItem = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <h4 className="text-lg font-semibold mb-3 text-gray-700">{label}</h4>
            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={item._id || index} className="flex flex-wrap items-end gap-3 p-3 bg-white border border-dashed rounded-lg shadow-sm">
                        
                        <div className="flex w-full items-center justify-between pb-2 mb-2 border-b">
                            <span className="font-bold text-sm text-amber-600">Item #{index + 1}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:text-red-600 p-1 rounded transition flex items-center justify-center"
                                title="Remove item"
                            >
                                {ICONS.Trash}
                            </button>
                        </div>

                        <div className="grid w-full gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                            {structure.map(field => (
                                <div key={field.key} className={`flex flex-col ${field.type === 'textarea' || field.key.includes('Image') ? 'col-span-full' : 'col-span-2 md:col-span-1'}`}>
                                    <label className="text-xs font-medium text-gray-500">{field.label}</label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={item[field.key] || ''}
                                            onChange={e => handleItemChange(index, field.key, e.target.value)}
                                            className="w-full p-2 border rounded text-sm focus:ring-amber-500 focus:border-amber-500 min-h-[80px]"
                                        />
                                    ) : (
                                        <input
                                            type={field.type || 'text'}
                                            value={item[field.key] || (field.type === 'number' && item[field.key] === 0 ? 0 : item[field.key] || '')}
                                            onChange={e => handleItemChange(index, field.key, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                                            className="w-full p-2 border rounded text-sm focus:ring-amber-500 focus:border-amber-500"
                                            min={field.type === 'number' ? 0 : undefined}
                                            step={field.type === 'number' ? "0.01" : undefined}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {canAdd && (
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-4 bg-amber-100 text-amber-700 p-2 rounded hover:bg-amber-200 transition flex items-center gap-2 font-medium"
                >
                    <span className="text-lg">{ICONS.Plus}</span> Add {structure[0]?.label}
                </button>
            )}
        </div>
    );
};


// --- PRODUCT FORM SCHEMA ---
const VARIANT_STRUCTURE = [
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'variantName', label: 'Name', type: 'text' },
    { key: 'quantity', label: 'Stock', type: 'number' },
    { key: 'variantPrice', label: 'Price', type: 'number' },
    { key: 'mrpPrice', label: 'MRP (Optional)', type: 'number' },
    { key: 'variantImage', label: 'Image URL', type: 'text', size: 'full' },
];

const DETAIL_STRUCTURE = [
    { key: 'icon', label: 'Icon Tag', type: 'text' },
    { key: 'detail', label: 'Detail Text', type: 'textarea' },
];


// --- ADMIN DASHBOARD COMPONENT ---

const AdminDashboard = () => {
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [page, setPage] = useState('login'); // login | list | edit | new
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    // Tracks if product data has been loaded once
    const [hasFetched, setHasFetched] = useState(false); 

    // --- NOTIFICATION HANDLER ---
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 4000);
    };

    // --- DATA FETCHING ---
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch products from API.');
            
            const data = await response.json();
            setProducts(data.map(p => ({ 
                ...p, 
                _id: p._id, // Keep _id for PUT requests
                id: p._id, // Use id for React keying
                // Ensure arrays are initialized for form editing
                imageUrls: p.imageUrls || [],
                variants: p.variants || [],
                productDetails: p.productDetails || [],
                contentGallery: p.contentGallery || []
            })));
            setLoading(false);
            setHasFetched(true); // Mark fetch as successful
        } catch (err) {
            console.error(err);
            showNotification('Error fetching products (Is the Node server running on port 3000?).', 'error');
            setLoading(false);
        }
    }, [showNotification]);

    // FIX: Optimized useEffect to prevent looping/blinking.
    useEffect(() => {
        // Only run if authenticated AND on the list page AND haven't fetched data yet
        if (isAuthenticated && page === 'list' && !hasFetched) {
            fetchProducts();
        }
    }, [isAuthenticated, page, hasFetched, fetchProducts]);

    // --- ROUTING/NAVIGATION ---
    const navigateTo = (newPage) => {
        setPage(newPage);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        navigateTo('login');
    };

    // --- AUTHENTICATION ---
    const handleLogin = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            setIsAuthenticated(true);
            navigateTo('list');
        } else {
            showNotification('Invalid credentials.', 'error');
        }
    };

    // --- CRUD OPERATIONS ---
    
    // START EDITING/CREATING
    const startEditProduct = (product) => {
        // Deep clone the product to avoid modifying state directly
        setEditingProduct(JSON.parse(JSON.stringify(product))); 
        navigateTo('edit');
    };

    const startNewProduct = () => {
        setEditingProduct({
            name: '', category: '', description: '', mrp: 0, discountedPrice: 0, stock: 0,
            imageUrls: [], variants: [], productDetails: [], contentGallery: [],
            averageRating: 0, reviewCount: 0, reviews: []
        });
        navigateTo('new');
    };

    // SUBMIT (Create or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingProduct._id ? 'PUT' : 'POST';
        const url = editingProduct._id ? `${API_URL}/${editingProduct._id}` : API_URL;
        
        // Clean up data for submission (remove react helper keys)
        const dataToSend = {
            ...editingProduct,
            _id: editingProduct._id, 
            id: undefined, 
            reviews: undefined, 
            averageRating: undefined,
            reviewCount: undefined,
            // Clean up empty strings inside arrays
            imageUrls: editingProduct.imageUrls.map(item => item.url || item).filter(url => url),
            contentGallery: editingProduct.contentGallery.map(item => item.url || item).filter(url => url),
            productDetails: editingProduct.productDetails.filter(d => d.detail),
            variants: editingProduct.variants.filter(v => v.sku && v.variantName)
        };
        
        // Handle stock presence based on variants
        if (!dataToSend.variants || dataToSend.variants.length === 0) {
             dataToSend.variants = undefined;
        } else {
             dataToSend.stock = undefined; 
        }

        setLoading(true);
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${method === 'POST' ? 'create' : 'update'} product.`);
            }

            showNotification(`Product ${method === 'POST' ? 'created' : 'updated'} successfully.`);
            setEditingProduct(null);
            setHasFetched(false); // Force a refresh of the list content
            navigateTo('list'); 
        } catch (err) {
            showNotification(err.message, 'error');
            setLoading(false);
        }
    };
    
    // DELETE
    const handleDeleteProduct = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the product: "${name}"?`)) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            
            if (!response.ok) throw new Error('Failed to delete product.');
            
            showNotification(`Product "${name}" deleted successfully.`);
            setHasFetched(false); // Force a refresh
            navigateTo('list');
        } catch (err) {
            showNotification(err.message, 'error');
            setLoading(false);
        }
    };
    
    // --- RENDER FUNCTIONS ---

    const renderLogin = () => (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            defaultValue={ADMIN_USER}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            defaultValue={ADMIN_PASS}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-amber-500 text-white p-3 rounded-lg font-semibold hover:bg-amber-600 transition duration-150 shadow-md"
                    >
                        Login
                    </button>
                </div>
                <p className="mt-4 text-center text-xs text-gray-500">Demo Credentials: **{ADMIN_USER}** / **{ADMIN_PASS}**</p>
            </form>
        </div>
    );

    const renderList = () => (
        <div className="p-6 md:p-10 min-h-screen bg-gray-50">
            <header className="flex justify-between items-center mb-8 pb-4 border-b">
                <h1 className="text-4xl font-extrabold text-gray-800">Product Catalog ({products.length})</h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={startNewProduct}
                        className="bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2 shadow-md"
                    >
                        <span className="text-lg">{ICONS.Plus}</span> New Product
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-gray-600 bg-white p-3 rounded-lg border hover:bg-gray-100 transition flex items-center gap-2"
                    >
                        {ICONS.Logout} Logout
                    </button>
                </div>
            </header>

            {loading && !hasFetched ? (
                <div className="text-center py-20 text-xl text-gray-500">Loading products...</div>
            ) : (
                <div className="shadow-xl rounded-lg overflow-hidden bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-1/12">{ICONS.Image} Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-4/12">Product Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-2/12">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-1/12">{ICONS.Price} Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-1/12">{ICONS.Stock} Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-2/12">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map(product => {
                                const mainPrice = product.discountedPrice || product.mrp;
                                const mainStock = product.variants?.length > 0 
                                    ? product.variants.reduce((sum, v) => sum + v.quantity, 0)
                                    : product.stock || 0;
                                return (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap w-1/12">
                                            <img 
                                                src={product.imageUrls[0] || product.variants[0]?.variantImage || 'https://placehold.co/40x40/ccc/fff?text=No+Img'} 
                                                alt={product.name} 
                                                className="h-10 w-10 object-cover rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 w-4/12">{product.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 w-2/12">{product.category}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 w-1/12">₹{mainPrice?.toFixed(2) || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 w-1/12">{mainStock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2 w-2/12">
                                            <button
                                                onClick={() => startEditProduct(product)}
                                                className="text-amber-600 hover:text-amber-800 p-2 rounded bg-amber-50"
                                                title="Edit Product"
                                            >
                                                {ICONS.Edit}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                className="text-red-600 hover:text-red-800 p-2 rounded bg-red-50"
                                                title="Delete Product"
                                            >
                                                {ICONS.Trash}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderEditor = () => {
        if (!editingProduct) return null;

        const isNew = page === 'new';
        
        // Generic handler for root fields
        const handleChange = (e) => {
            const { name, value, type } = e.target;
            setEditingProduct(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) || 0 : value
            }));
        };

        return (
            <form onSubmit={handleSubmit} className="p-6 md:p-10 min-h-screen bg-gray-50">
                {/* FIX: Centered Header Container */}
                <header className="flex justify-between items-start mb-8 pb-4 border-b max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 pr-4">{isNew ? 'Create New Product' : `Edit: ${editingProduct.name}`}</h1>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => navigateTo('list')}
                            className="text-gray-600 bg-white p-3 rounded-lg border hover:bg-gray-100 transition flex items-center gap-2"
                        >
                            {ICONS.Cancel} Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-amber-500 text-white p-3 rounded-lg font-semibold hover:bg-amber-600 transition flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                            {ICONS.Save} {loading ? 'Saving...' : (isNew ? 'Create Product' : 'Save Changes')}
                        </button>
                    </div>
                </header>
                
                {/* Main Content Wrapper (Centered and Constrained) */}
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* --- 1. CORE DETAILS --- */}
                    <div className="bg-white p-6 rounded-lg shadow-xl space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Product Identity</h3>
                        
                        {/* FIX: Improved responsiveness and spacing for inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input name="name" type="text" value={editingProduct.name} onChange={handleChange} required className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input name="category" type="text" value={editingProduct.category} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={editingProduct.description} onChange={handleChange} rows="6" className="w-full p-2 border rounded mt-1" />
                        </div>
                    </div>
                    
                    {/* --- 2. PRICING & BASE STOCK --- */}
                    <div className="bg-white p-6 rounded-lg shadow-xl space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Pricing & Base Stock</h3>
                        <p className="text-sm text-gray-500">Base stock and prices are ignored if variants are present.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">MRP</label>
                                <input name="mrp" type="number" step="0.01" value={editingProduct.mrp} onChange={handleChange} className="w-full p-2 border rounded mt-1" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Discounted Price (Selling)</label>
                                <input name="discountedPrice" type="number" step="0.01" value={editingProduct.discountedPrice} onChange={handleChange} required className="w-full p-2 border rounded mt-1" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Base Stock (No Variants)</label>
                                <input name="stock" type="number" value={editingProduct.stock} onChange={handleChange} className="w-full p-2 border rounded mt-1" min="0" />
                            </div>
                        </div>
                    </div>
                    
                    {/* --- 3. VARIANT EDITOR --- */}
                    <ArrayEditor
                        label="Product Variants (Colors, Packs, etc.)"
                        items={editingProduct.variants}
                        onChange={newVariants => setEditingProduct(prev => ({ ...prev, variants: newVariants }))}
                        structure={VARIANT_STRUCTURE}
                    />

                    {/* --- 4. IMAGE URLs --- */}
                    <ArrayEditor
                        label="Main Image Gallery URLs"
                        items={editingProduct.imageUrls.map(url => ({ url }))}
                        onChange={newUrls => setEditingProduct(prev => ({ ...prev, imageUrls: newUrls.map(item => item.url) }))}
                        structure={[{ key: 'url', label: 'Image URL', type: 'text', size: 'full' }]}
                    />

                    {/* --- 5. STRUCTURED DETAILS (What's in the Box & Content Gallery) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ArrayEditor
                            label="Product Details (What's Included)"
                            items={editingProduct.productDetails}
                            onChange={newDetails => setEditingProduct(prev => ({ ...prev, productDetails: newDetails }))}
                            structure={DETAIL_STRUCTURE}
                        />
                         <ArrayEditor
                            label="Content Gallery/Highlights URLs"
                            items={editingProduct.contentGallery.map(url => ({ url }))}
                            onChange={newUrls => setEditingProduct(prev => ({ ...prev, contentGallery: newUrls.map(item => item.url) }))}
                            structure={[{ key: 'url', label: 'Highlight URL', type: 'text', size: 'full' }]}
                        />
                    </div>
                </div>
            </form>
        );
    };

    return (
        <>
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <div className="admin-app">
                {!isAuthenticated && renderLogin()}

                {isAuthenticated && page === 'list' && renderList()}

                {isAuthenticated && (page === 'edit' || page === 'new') && renderEditor()}
            </div>
        </>
    );
};

export default AdminDashboard;
