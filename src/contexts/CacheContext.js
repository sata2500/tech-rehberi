// src/contexts/CacheContext.js
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Cache expiration time (30 minutes by default)
const DEFAULT_CACHE_EXPIRATION = 30 * 60 * 1000;

// Cache reducer for state management
const cacheReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEM':
      return {
        ...state,
        [action.collection]: {
          ...state[action.collection],
          [action.id]: {
            data: action.data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (action.expiration || DEFAULT_CACHE_EXPIRATION)
          }
        }
      };
    
    case 'REMOVE_ITEM':
      if (!state[action.collection]) return state;
      const newCollection = { ...state[action.collection] };
      delete newCollection[action.id];
      return {
        ...state,
        [action.collection]: newCollection
      };
    
    case 'CLEAR_COLLECTION':
      const newState = { ...state };
      delete newState[action.collection];
      return newState;
    
    case 'CLEAR_ALL':
      return {};
    
    case 'UPDATE_ITEM':
      if (!state[action.collection] || !state[action.collection][action.id]) return state;
      return {
        ...state,
        [action.collection]: {
          ...state[action.collection],
          [action.id]: {
            ...state[action.collection][action.id],
            data: {
              ...state[action.collection][action.id].data,
              ...action.data
            },
            timestamp: Date.now(),
            expiresAt: Date.now() + (action.expiration || DEFAULT_CACHE_EXPIRATION)
          }
        }
      };
    
    case 'SET_QUERY':
      return {
        ...state,
        queries: {
          ...state.queries,
          [action.queryKey]: {
            data: action.data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (action.expiration || DEFAULT_CACHE_EXPIRATION)
          }
        }
      };
    
    case 'CLEAR_EXPIRED':
      const now = Date.now();
      const cleanedState = { ...state };
      
      // Clean collections
      Object.keys(cleanedState).forEach(collection => {
        if (collection === 'queries') return;
        
        const collectionData = { ...cleanedState[collection] };
        let hasRemovedItems = false;
        
        Object.keys(collectionData).forEach(id => {
          if (collectionData[id].expiresAt < now) {
            delete collectionData[id];
            hasRemovedItems = true;
          }
        });
        
        if (hasRemovedItems) {
          cleanedState[collection] = collectionData;
        }
      });
      
      // Clean queries
      if (cleanedState.queries) {
        const queries = { ...cleanedState.queries };
        let hasRemovedQueries = false;
        
        Object.keys(queries).forEach(key => {
          if (queries[key].expiresAt < now) {
            delete queries[key];
            hasRemovedQueries = true;
          }
        });
        
        if (hasRemovedQueries) {
          cleanedState.queries = queries;
        }
      }
      
      return cleanedState;
      
    default:
      return state;
  }
};

// Create context
const CacheContext = createContext();

// Cache provider component
export function CacheProvider({ children, initialCache = {} }) {
  const [cache, dispatch] = useReducer(cacheReducer, { ...initialCache, queries: {} });
  
  // Periodically clean expired items
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch({ type: 'CLEAR_EXPIRED' });
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  // Set item in cache
  const setItem = useCallback((collection, id, data, expiration) => {
    dispatch({
      type: 'SET_ITEM',
      collection,
      id,
      data,
      expiration
    });
  }, []);
  
  // Get item from cache
  const getItem = useCallback((collection, id) => {
    const collectionCache = cache[collection];
    if (!collectionCache || !collectionCache[id]) return null;
    
    const cachedItem = collectionCache[id];
    
    // Check if expired
    if (cachedItem.expiresAt < Date.now()) {
      dispatch({
        type: 'REMOVE_ITEM',
        collection,
        id
      });
      return null;
    }
    
    return cachedItem.data;
  }, [cache]);
  
  // Remove item from cache
  const removeItem = useCallback((collection, id) => {
    dispatch({
      type: 'REMOVE_ITEM',
      collection,
      id
    });
  }, []);
  
  // Update item in cache
  const updateItem = useCallback((collection, id, data, expiration) => {
    dispatch({
      type: 'UPDATE_ITEM',
      collection,
      id,
      data,
      expiration
    });
  }, []);
  
  // Clear collection from cache
  const clearCollection = useCallback((collection) => {
    dispatch({
      type: 'CLEAR_COLLECTION',
      collection
    });
  }, []);
  
  // Clear all cache
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);
  
  // Set query result in cache
  const setQuery = useCallback((queryKey, data, expiration) => {
    dispatch({
      type: 'SET_QUERY',
      queryKey,
      data,
      expiration
    });
  }, []);
  
  // Get query result from cache
  const getQuery = useCallback((queryKey) => {
    if (!cache.queries || !cache.queries[queryKey]) return null;
    
    const cachedQuery = cache.queries[queryKey];
    
    // Check if expired
    if (cachedQuery.expiresAt < Date.now()) {
      const newQueries = { ...cache.queries };
      delete newQueries[queryKey];
      dispatch({
        type: 'SET_QUERY',
        queries: newQueries
      });
      return null;
    }
    
    return cachedQuery.data;
  }, [cache]);
  
  // Check if a cached item is stale (over 50% of its lifetime has passed)
  const isStale = useCallback((collection, id) => {
    const collectionCache = cache[collection];
    if (!collectionCache || !collectionCache[id]) return true;
    
    const cachedItem = collectionCache[id];
    const lifetime = cachedItem.expiresAt - cachedItem.timestamp;
    const elapsed = Date.now() - cachedItem.timestamp;
    
    return elapsed > (lifetime * 0.5);
  }, [cache]);
  
  // Check if a cached query is stale
  const isQueryStale = useCallback((queryKey) => {
    if (!cache.queries || !cache.queries[queryKey]) return true;
    
    const cachedQuery = cache.queries[queryKey];
    const lifetime = cachedQuery.expiresAt - cachedQuery.timestamp;
    const elapsed = Date.now() - cachedQuery.timestamp;
    
    return elapsed > (lifetime * 0.5);
  }, [cache]);
  
  const value = {
    cache,
    setItem,
    getItem,
    removeItem,
    updateItem,
    clearCollection,
    clearAll,
    setQuery,
    getQuery,
    isStale,
    isQueryStale
  };
  
  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

// Custom hook to use the cache
export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}

export default CacheContext;