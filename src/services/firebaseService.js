// src/services/firebaseService.js
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    orderBy, 
    where,
    serverTimestamp 
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, storage } from '../config/firebase';
  
  class FirebaseService {
    constructor() {
      this.candidatesCollection = collection(db, 'candidates');
      this.interviewsCollection = collection(db, 'interviews');
      this.resumesCollection = collection(db, 'resumes');
    }
  
    // CANDIDATE OPERATIONS
    async createCandidate(candidateData) {
      try {
        console.log('Creating candidate in database:', candidateData);
  
        const candidateWithTimestamp = {
          ...candidateData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active'
        };
  
        const docRef = await addDoc(this.candidatesCollection, candidateWithTimestamp);
        console.log('Candidate created with ID:', docRef.id);
  
        return {
          id: docRef.id,
          ...candidateWithTimestamp
        };
      } catch (error) {
        console.error('Error creating candidate:', error);
        throw new Error('Failed to save candidate data');
      }
    }
  
    async updateCandidate(candidateId, updateData) {
      try {
        console.log('Updating candidate:', candidateId, updateData);
  
        const candidateRef = doc(db, 'candidates', candidateId);
        const updateWithTimestamp = {
          ...updateData,
          updatedAt: serverTimestamp()
        };
  
        await updateDoc(candidateRef, updateWithTimestamp);
        console.log('Candidate updated successfully');
  
        return { id: candidateId, ...updateWithTimestamp };
      } catch (error) {
        console.error('Error updating candidate:', error);
        throw new Error('Failed to update candidate data');
      }
    }
  
    async getCandidate(candidateId) {
      try {
        const candidateRef = doc(db, 'candidates', candidateId);
        const candidateSnap = await getDoc(candidateRef);
  
        if (candidateSnap.exists()) {
          return {
            id: candidateSnap.id,
            ...candidateSnap.data()
          };
        } else {
          throw new Error('Candidate not found');
        }
      } catch (error) {
        console.error('Error getting candidate:', error);
        throw new Error('Failed to fetch candidate data');
      }
    }
  
    async getAllCandidates() {
      try {
        console.log('Fetching all candidates...');
  
        const q = query(
          this.candidatesCollection, 
          orderBy('createdAt', 'desc')
        );
  
        const querySnapshot = await getDocs(q);
        const candidates = [];
  
        querySnapshot.forEach((doc) => {
          candidates.push({
            id: doc.id,
            ...doc.data()
          });
        });
  
        console.log('Fetched candidates:', candidates.length);
        return candidates;
      } catch (error) {
        console.error('Error getting candidates:', error);
        throw new Error('Failed to fetch candidates');
      }
    }
  
    async deleteCandidate(candidateId) {
      try {
        const candidateRef = doc(db, 'candidates', candidateId);
        await deleteDoc(candidateRef);
        console.log('Candidate deleted:', candidateId);
      } catch (error) {
        console.error('Error deleting candidate:', error);
        throw new Error('Failed to delete candidate');
      }
    }
  
    // RESUME FILE OPERATIONS
    async uploadResumeFile(file, candidateId) {
      try {
        console.log('Uploading resume file:', file.name);
  
        // Create a reference to the file location
        const fileName = `resumes/${candidateId}_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
  
        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);
        console.log('File uploaded successfully');
  
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('File available at:', downloadURL);
  
        // Save resume metadata to Firestore
        const resumeData = {
          candidateId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          downloadURL,
          uploadedAt: serverTimestamp()
        };
  
        const docRef = await addDoc(this.resumesCollection, resumeData);
  
        return {
          id: docRef.id,
          downloadURL,
          ...resumeData
        };
      } catch (error) {
        console.error('Error uploading resume:', error);
        throw new Error('Failed to upload resume file');
      }
    }
  }
  
  export const firebaseService = new FirebaseService();