// src/hooks/useFirestoreQuery.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getFirebaseFirestore, 
  collection, 
  getDocs, 
  onSnapshot, 
  query as firestoreQuery
} from 'firebase/firestore';
import { useCache } from '../contexts/CacheContext';
import { serializeQuery } from '../lib/query-helpers';

// Default cache expiration for query results (10 minutes)
const DEFAULT_QUERY_EXPIRATION = 10 * 60 * 1000;

/**
 * Custom hook for querying Firestore with caching
 * 
 * @param {string} collectionPath - Path to the Firestore collection
 * @param {Array} queryConstraints - Array of Firestore query constraints (where, orderBy, etc.)
 * @param {Object} options - Hook options
 * @param {boolean} options.subscribe - Whether to subscribe to real-time updates (default: false)
 * @param {number} options.cacheTime - How long to cache the query results in ms (default: 10 minutes)
 * @param {boolean} options.refetchOnMount - Whether to refetch data when component mounts even if cached (default: false)
 * @param {boolean} options.suspense - Whether to use React Suspense (default: false)
 */
export default function useFirestoreQuery(
  collectionPath, 
  queryConstraints = [], 
  options = {}
) {
  const {
    subscribe = false,
    cacheTime = DEFAULT_QUERY_EXPIRATION,
    refetchOnMount = false,
    suspense = false
  } = options;
  
  const db = getFirebaseFirestore();
  const { setQuery, getQuery, isQueryStale } = useCache();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create query
  const collectionRef = collection(db, collectionPath);
  const query = firestoreQuery(collectionRef, ...queryConstraints);
  
  // Generate unique key for this query
  const queryKey = serializeQuery(collectionPath, queryConstraints);
  
  // Keep track of subscriptions
  const unsubscribeRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Clean up subscription
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
  
  // Fetch data from Firestore
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const querySnapshot = await getDocs(query);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (isMountedRef.current) {
        setData(docs);
        setError(null);
        setQuery(queryKey, docs, cacheTime);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching from Firestore:', err);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [query, queryKey, cacheTime, setQuery]);
  
  // Subscribe to real-time updates
  const subscribeToData = useCallback(() => {
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      query,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (isMountedRef.current) {
          setData(docs);
          setLoading(false);
          setError(null);
          setQuery(queryKey, docs, cacheTime);
        }
      },
      (err) => {
        if (isMountedRef.current) {
          console.error('Error subscribing to Firestore:', err);
          setError(err);
          setLoading(false);
        }
      }
    );
    
    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [query, queryKey, cacheTime, setQuery]);
  
  // Main effect for fetching or subscribing
  useEffect(() => {
    // Clean up previous subscription if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Try to get from cache first
    const cachedData = getQuery(queryKey);
    const isStale = isQueryStale(queryKey);
    
    if (cachedData && !refetchOnMount && !isStale) {
      // Use cached data
      setData(cachedData);
      setLoading(false);
      setError(null);
      
      // For subscriptions, we still need to subscribe to updates
      if (subscribe) {
        subscribeToData();
      } else if (isStale) {
        // If data is stale, fetch fresh data in the background
        fetchData().catch(console.error);
      }
    } else {
      // No cache or forced refetch
      if (subscribe) {
        subscribeToData();
      } else {
        fetchData().catch(console.error);
      }
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [queryKey, subscribe, fetchData, subscribeToData, getQuery, isQueryStale, refetchOnMount]);
  
  // Force refetch data
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}