import { useState } from 'react';
import { loginHistory, savedItems, wishlist } from '../api/databaseAPI';

/**
 * Hook for managing login history
 */
export const useLoginHistory = (userId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLoginId, setCurrentLoginId] = useState(null);

  const recordLogin = async (ipAddress, userAgent, deviceType) => {
    try {
      setLoading(true);
      const result = await loginHistory.recordLogin(userId, ipAddress, userAgent, deviceType);
      setCurrentLoginId(result.loginId);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const recordLogout = async () => {
    try {
      if (currentLoginId) {
        await loginHistory.recordLogout(currentLoginId);
        setCurrentLoginId(null);
      }
    } catch (error) {
      console.error('Error recording logout:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await loginHistory.getHistory(userId);
      setHistory(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, recordLogin, recordLogout, fetchHistory, currentLoginId };
};

/**
 * Hook for managing saved items
 */
export const useSavedItems = (userId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const addItem = async (itemId, itemName, itemType, itemDescription, itemImage) => {
    try {
      setLoading(true);
      const result = await savedItems.add(userId, itemId, itemName, itemType, itemDescription, itemImage);
      // Refresh the list
      await fetchItems();
      return result;
    } catch (error) {
      console.error('Error adding saved item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (savedItemId) => {
    try {
      setLoading(true);
      await savedItems.remove(savedItemId);
      // Refresh the list
      await fetchItems();
    } catch (error) {
      console.error('Error removing saved item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkItem = async (itemId) => {
    try {
      return await savedItems.check(userId, itemId);
    } catch (error) {
      console.error('Error checking saved item:', error);
      return { isSaved: false };
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await savedItems.getAll(userId);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching saved items:', error);
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, addItem, removeItem, checkItem, fetchItems };
};

/**
 * Hook for managing wishlist
 */
export const useWishlist = (userId) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const addItem = async (itemId, itemName, itemType, itemDescription, itemImage, priority = 'medium') => {
    try {
      setLoading(true);
      const result = await wishlist.add(userId, itemId, itemName, itemType, itemDescription, itemImage, priority);
      // Refresh the list
      await fetchItems();
      return result;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (wishlistId) => {
    try {
      setLoading(true);
      await wishlist.remove(wishlistId);
      // Refresh the list
      await fetchItems();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePriority = async (wishlistId, priority) => {
    try {
      setLoading(true);
      await wishlist.updatePriority(wishlistId, priority);
      // Refresh the list
      await fetchItems();
    } catch (error) {
      console.error('Error updating priority:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkItem = async (itemId) => {
    try {
      return await wishlist.check(userId, itemId);
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return { isInWishlist: false };
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await wishlist.getAll(userId);
      setWishlistItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    /** Same data as wishlistItems; useSavedItems uses `items` — dashboards expect this name. */
    items: wishlistItems,
    wishlistItems,
    loading,
    addItem,
    removeItem,
    updatePriority,
    checkItem,
    fetchItems
  };
};
