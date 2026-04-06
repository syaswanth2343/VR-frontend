import React, { useState, useEffect } from 'react';
import { useSavedItems, useWishlist } from '../hooks/useDatabase';
import './SavedWishlistExample.css';

/**
 * Example component showing how to use Saved Items and Wishlist
 * This demonstrates the database integration for the frontend
 */
const SavedWishlistExample = ({ userId = 1 }) => {
  const { items: savedItems, addItem: addSavedItem, removeItem: removeSavedItem, fetchItems: fetchSavedItems } = useSavedItems(userId);
  const { wishlistItems, addItem: addWishlistItem, removeItem: removeWishlistItem, updatePriority, fetchItems: fetchWishlistItems } = useWishlist(userId);
  const [activeTab, setActiveTab] = useState('saved');

  useEffect(() => {
    // Load data when component mounts
    fetchSavedItems();
    fetchWishlistItems();
  }, [userId, fetchSavedItems, fetchWishlistItems]);

  const handleAddToSaved = async () => {
    try {
      await addSavedItem(
        'item-001',
        'Sample Item',
        'course',
        'This is a sample course item',
        'https://via.placeholder.com/200'
      );
      alert('Item added to saved items!');
    } catch (e) {
      console.error('addSavedItem error:', e);
      alert('Item might already be saved');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await addWishlistItem(
        'item-002',
        'Wishlist Item',
        'course',
        'This is a wishlist item',
        'https://via.placeholder.com/200',
        'high'
      );
      alert('Item added to wishlist!');
    } catch (e) {
      console.error('addWishlistItem error:', e);
      alert('Item might already be in wishlist');
    }
  };

  return (
    <div className="saved-wishlist-container">
      <h1>Saved Items & Wishlist</h1>

      <div className="tab-buttons">
        <button 
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Items ({savedItems.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          Wishlist ({wishlistItems.length})
        </button>
      </div>

      {activeTab === 'saved' && (
        <div className="tab-content">
          <button className="action-btn" onClick={handleAddToSaved}>
            + Add Test Item to Saved
          </button>
          <div className="items-list">
            {savedItems.length === 0 ? (
              <p>No saved items yet</p>
            ) : (
              savedItems.map(item => (
                <div key={item.id} className="item-card">
                  <img src={item.item_image} alt={item.item_name} />
                  <div className="item-info">
                    <h3>{item.item_name}</h3>
                    <p>{item.item_description}</p>
                    <span className="item-type">{item.item_type}</span>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removeSavedItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="tab-content">
          <button className="action-btn" onClick={handleAddToWishlist}>
            + Add Test Item to Wishlist
          </button>
          <div className="items-list">
            {wishlistItems.length === 0 ? (
              <p>No wishlist items yet</p>
            ) : (
              wishlistItems.map(item => (
                <div key={item.id} className="item-card">
                  <img src={item.item_image} alt={item.item_name} />
                  <div className="item-info">
                    <h3>{item.item_name}</h3>
                    <p>{item.item_description}</p>
                    <span className="item-type">{item.item_type}</span>
                  </div>
                  <div className="item-actions">
                    <select 
                      value={item.priority}
                      onChange={(e) => updatePriority(item.id, e.target.value)}
                      className="priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <button 
                      className="remove-btn"
                      onClick={() => removeWishlistItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedWishlistExample;
