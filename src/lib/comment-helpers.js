// src/lib/comment-helpers.js
import { 
    collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, 
    query, where, orderBy, serverTimestamp, limit, increment 
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Yeni yorum ekle
  export const addComment = async (postId, userId, content, parentId = null) => {
    try {
      const newComment = {
        postId,
        userId,
        content,
        parentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false,
        reportCount: 0,
        likes: 0
      };
      
      const docRef = await addDoc(collection(db, 'comments'), newComment);
      
      // Yazının yorum sayısını güncelle
      await updatePostCommentCount(postId);
      
      // Yeni yorumu ID'si ile birlikte döndür (anında gösterim için)
      return {
        id: docRef.id,
        ...newComment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Yorum eklenirken hata:', error);
      throw error;
    }
  };
  
  // Yazıya ait tüm yorumları getir
  export const getPostComments = async (postId) => {
    try {
      // Ana yorumları önce getir, sonra yanıtları
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        where('isDeleted', '==', false),
        where('parentId', '==', null),
        orderBy('createdAt', 'desc')
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      if (commentsSnapshot.empty) {
        return [];
      }
      
      // Firebase zaman damgalarını ISO dizelerine dönüştür
      const comments = commentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
        };
      });
      
      // Yanıtları getir
      const repliesQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        where('isDeleted', '==', false),
        where('parentId', '!=', null),
        orderBy('parentId'),
        orderBy('createdAt')
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const replies = repliesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
        };
      });
      
      // Yanıtları ilgili yorumlara ekle
      const commentMap = {};
      comments.forEach(comment => {
        comment.replies = [];
        commentMap[comment.id] = comment;
      });
      
      replies.forEach(reply => {
        if (commentMap[reply.parentId]) {
          commentMap[reply.parentId].replies.push(reply);
        }
      });
      
      return comments;
    } catch (error) {
      console.error('Yorumlar alınırken hata:', error);
      throw error;
    }
  };
  
  // Yorum güncelle
  export const updateComment = async (commentId, content) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        content: content,
        updatedAt: serverTimestamp(),
        isEdited: true
      });
      
      return {
        success: true,
        message: 'Yorum başarıyla güncellendi.'
      };
    } catch (error) {
      console.error('Yorum güncellenirken hata:', error);
      throw error;
    }
  };
  
  // Yorumu sil (yumuşak silme)
  export const deleteComment = async (commentId) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      
      // Önce yorumu al
      const commentSnap = await getDoc(commentRef);
      if (!commentSnap.exists()) {
        throw new Error('Yorum bulunamadı');
      }
      
      const commentData = commentSnap.data();
      
      // Yorumu yumuşak sil
      await updateDoc(commentRef, {
        isDeleted: true,
        content: 'Bu yorum silindi.',
        updatedAt: serverTimestamp()
      });
      
      // Yazının yorum sayısını güncelle
      await updatePostCommentCount(commentData.postId);
      
      return {
        success: true,
        message: 'Yorum başarıyla silindi.'
      };
    } catch (error) {
      console.error('Yorum silinirken hata:', error);
      throw error;
    }
  };
  
  // Yorumu kalıcı olarak sil (sadece admin)
  export const hardDeleteComment = async (commentId) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      
      // Önce yorumu al
      const commentSnap = await getDoc(commentRef);
      if (!commentSnap.exists()) {
        throw new Error('Yorum bulunamadı');
      }
      
      const commentData = commentSnap.data();
      
      // Yorumu ve yanıtlarını sil
      await deleteDoc(commentRef);
      
      // Eğer yanıtlar varsa onları da sil
      const repliesQuery = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId)
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Yazının yorum sayısını güncelle
      await updatePostCommentCount(commentData.postId);
      
      return {
        success: true,
        message: 'Yorum kalıcı olarak silindi.'
      };
    } catch (error) {
      console.error('Yorum kalıcı olarak silinirken hata:', error);
      throw error;
    }
  };
  
  // Kullanıcının yorumu düzenleyebilme/silebilme yetkisi kontrolü
  export const canModifyComment = (comment, userId, isAdmin) => {
    if (!comment || !userId) return false;
    
    // Adminler her yorumu düzenleyebilir
    if (isAdmin) return true;
    
    // Kullanıcılar sadece kendi yorumlarını düzenleyebilir
    return comment.userId === userId;
  };
  
  // Yorumu şikayet et
  export const reportComment = async (commentId) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        reportCount: increment(1)
      });
      
      return {
        success: true,
        message: 'Yorum raporlandı. Teşekkürler!'
      };
    } catch (error) {
      console.error('Yorum raporlanırken hata:', error);
      throw error;
    }
  };
  
  // Yorumu beğen
  export const likeComment = async (commentId) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likes: increment(1)
      });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Yorum beğenilirken hata:', error);
      throw error;
    }
  };
  
  // Yorumu yanıtla
  export const replyToComment = async (postId, parentId, userId, content) => {
    try {
      // Yanıt eklemek için normal yorum ekleme fonksiyonunu kullan
      const reply = await addComment(postId, userId, content, parentId);
      return reply;
    } catch (error) {
      console.error('Yanıt eklenirken hata:', error);
      throw error;
    }
  };
  
  // Yorumlar için kullanıcı verilerini al
  export const getUsersForComments = async (comments) => {
    try {
      // Ana yorumlar ve yanıtlarından benzersiz kullanıcı ID'lerini çıkar
      const userIds = new Set();
      
      // Ana yorumlardan kullanıcı ID'lerini topla
      comments.forEach(comment => {
        userIds.add(comment.userId);
        
        // Yanıtlardan kullanıcı ID'lerini topla
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(reply => {
            userIds.add(reply.userId);
          });
        }
      });
      
      // Her kullanıcı için verileri al
      const users = {};
      
      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          users[userId] = {
            id: userId,
            ...userDoc.data()
          };
        }
      }
      
      return users;
    } catch (error) {
      console.error('Yorum yapan kullanıcılar alınırken hata:', error);
      throw error;
    }
  };
  
  // Yazının yorum sayısını güncelle
  export const updatePostCommentCount = async (postId) => {
    try {
      // Silinmemiş tüm yorumları say
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        where('isDeleted', '==', false)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentCount = commentsSnapshot.size;
      
      // Yazının yorum sayısını güncelle
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentCount: commentCount
      });
      
      return commentCount;
    } catch (error) {
      console.error('Yorum sayısı güncellenirken hata:', error);
      throw error;
    }
  };