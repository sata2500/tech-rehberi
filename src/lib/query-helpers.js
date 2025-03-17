// src/lib/query-helpers.js
import { 
    where, 
    orderBy, 
    limit, 
    startAfter, 
    endBefore, 
    startAt, 
    endAt, 
    limitToLast
  } from 'firebase/firestore';
  
  /**
   * Serialize a Firestore query to a unique string for cache keys
   * 
   * @param {string} collectionPath - Path to the collection
   * @param {Array} constraints - Array of query constraints
   * @returns {string} A serialized query string for use as a cache key
   */
  export function serializeQuery(collectionPath, constraints = []) {
    try {
      // Start with the collection path
      let queryKey = `collection:${collectionPath}`;
      
      // Process each constraint
      constraints.forEach(constraint => {
        // Extract type from the constraint object
        const type = constraint._type || constraint.type;
        
        if (!type) {
          return;
        }
        
        switch (type) {
          case 'where':
            // Extract field path, operator and value
            const { _field, _op, _value } = constraint;
            queryKey += `|where:${_field}:${_op}:${serializeValue(_value)}`;
            break;
            
          case 'orderBy':
            // Extract field path and direction
            const { _field: orderField, _direction } = constraint;
            queryKey += `|orderBy:${orderField}:${_direction || 'asc'}`;
            break;
            
          case 'limit':
            // Extract limit value
            const { _limit } = constraint;
            queryKey += `|limit:${_limit}`;
            break;
            
          case 'limitToLast':
            // Extract limit value
            const { _limit: lastLimit } = constraint;
            queryKey += `|limitToLast:${lastLimit}`;
            break;
            
          case 'startAt':
          case 'startAfter':
          case 'endAt':
          case 'endBefore':
            // These are cursor-based pagination constraints
            // They're tricky to serialize as they could contain complex objects
            // For simplicity, we'll use their type and a hash of their values
            queryKey += `|${type}:${hashCode(JSON.stringify(constraint._values || []))}`;
            break;
            
          default:
            // For unknown constraints, add type
            queryKey += `|${type}`;
        }
      });
      
      return queryKey;
    } catch (error) {
      console.error('Error serializing query', error);
      
      // Fallback: create a hash from the entire collection + constraints
      const fallbackStr = collectionPath + JSON.stringify(constraints);
      return `fallback:${hashCode(fallbackStr)}`;
    }
  }
  
  /**
   * Simple hash code function for strings
   * 
   * @param {string} str - Input string
   * @returns {string} A hash code
   */
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
  
  /**
   * Serialize a value to a string representation for cache keys
   * 
   * @param {*} value - The value to serialize
   * @returns {string} A string representation of the value
   */
  function serializeValue(value) {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (Array.isArray(value)) {
      return `array:${value.map(serializeValue).join(',')}`;
    }
    
    if (value instanceof Date) {
      return `date:${value.getTime()}`;
    }
    
    if (typeof value === 'object') {
      // For Firestore references or other complex objects,
      // we'll use a hash of their string representation
      try {
        return `obj:${hashCode(JSON.stringify(value))}`;
      } catch (e) {
        return `obj:${hashCode(Object.keys(value).join('|'))}`;
      }
    }
    
    // For primitive values
    return `${typeof value}:${value}`;
  }
  
  /**
   * Create a query with multiple where clauses
   * 
   * @param {Object} filters - Object containing field:value pairs for filtering
   * @param {string} operator - Firestore comparison operator (default: '==')
   * @returns {Array} Array of where constraints
   */
  export function createWhereConstraints(filters, operator = '==') {
    const constraints = [];
    
    if (!filters || typeof filters !== 'object') {
      return constraints;
    }
    
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        constraints.push(where(field, operator, value));
      }
    });
    
    return constraints;
  }
  
  /**
   * Create pagination parameters for Firestore queries
   * 
   * @param {Object} paginationOptions - Options for pagination
   * @param {number} paginationOptions.pageSize - Number of items per page
   * @param {*} paginationOptions.cursor - Cursor for pagination (last document from previous query)
   * @param {string} paginationOptions.direction - Direction of pagination ('next' or 'prev')
   * @returns {Array} Array of pagination constraints
   */
  export function createPaginationConstraints(paginationOptions = {}) {
    const {
      pageSize = 10,
      cursor = null,
      direction = 'next'
    } = paginationOptions;
    
    const constraints = [limit(pageSize)];
    
    if (cursor) {
      if (direction === 'next') {
        constraints.push(startAfter(cursor));
      } else if (direction === 'prev') {
        // For previous page, we need to use limitToLast and endBefore
        constraints.pop(); // Remove the previous limit
        constraints.push(limitToLast(pageSize));
        constraints.push(endBefore(cursor));
      }
    }
    
    return constraints;
  }