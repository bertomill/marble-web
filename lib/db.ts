import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Saves a project to the Firestore database
 * @param userId - The user ID
 * @param userEmail - The user's email
 * @param projectId - The project ID
 * @param projectData - The project data to save
 */
export async function saveProject(
  userId: string, 
  userEmail: string, 
  projectId: string, 
  projectData: Record<string, any>
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, 
      {
        ...projectData,
        userId,
        userEmail,
        updatedAt: new Date()
      }, 
      { merge: true }
    );
    console.log(`Project ${projectId} saved successfully`);
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
} 