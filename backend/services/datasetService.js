import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_PATH = path.join(__dirname, '../data/users_dataset.json');

/**
 * Ensures the dataset file exists. If not, creates an empty array.
 */
async function ensureDatasetExists() {
  try {
    const dirPath = path.join(__dirname, '../data');
    await fs.mkdir(dirPath, { recursive: true });
    
    try {
      await fs.access(DATASET_PATH);
    } catch {
      await fs.writeFile(DATASET_PATH, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to initialize dataset:', err);
  }
}

// Initialize on load
ensureDatasetExists();

/**
 * Retrieves all users from the dataset
 */
export async function getUsers() {
  try {
    const data = await fs.readFile(DATASET_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

/**
 * Finds a specific user by email
 */
export async function getUserByEmail(email) {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Saves a new user to the dataset
 */
export async function saveUser(userObj) {
  const users = await getUsers();
  users.push(userObj);
  await fs.writeFile(DATASET_PATH, JSON.stringify(users, null, 2), 'utf-8');
  return userObj;
}

/**
 * Updates an existing user by email
 */
export async function updateUser(email, updates) {
  const users = await getUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (index === -1) return null;
  
  // Merge existing profile with updates (excluding sensitive immutable fields like password and core ID)
  const userToUpdate = users[index];
  
  if (updates.name) userToUpdate.name = updates.name;
  if (updates.emergencyContact) userToUpdate.emergencyContact = updates.emergencyContact;
  
  users[index] = userToUpdate;
  await fs.writeFile(DATASET_PATH, JSON.stringify(users, null, 2), 'utf-8');
  
  return userToUpdate;
}

/**
 * Permanently deletes a user from the dataset by email
 */
export async function deleteUser(email) {
  const users = await getUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (index === -1) return false;
  
  // Remove the user entirely from the memory array
  users.splice(index, 1);
  
  // Save dataset structurally
  await fs.writeFile(DATASET_PATH, JSON.stringify(users, null, 2), 'utf-8');
  return true;
}
