import e from 'express';
import db from '../config/db.js';
import bcrypt from 'bcryptjs';

class User {
    /** 
     * Create a new user     * @param {string} username - The username of the user
     * @param {string} email - The email of the user
     * @param {string} password - The password of the user (will be hashed)
    */
   static async create(name, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, hashedPassword]
    );
    return result.rows[0];
   }
    /** 
     * Find user by ID
    */
    static async findById(id) {
        const result = await db.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }
    /** 
     * Update password
    */
    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
         await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email',
            [hashedPassword, id]
        );
    }
    /** 
     * Verify password    */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}
export default User;