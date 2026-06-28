import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import UserPreference from '../models/UserPreference.js';

/** 
 * generate JWT token for authenticated user
 * @param {Object} user - The user object
 * @returns {string} - The generated JWT token
 */
const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
}
/** 
 * Register a new user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        //validate input
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
        }
        //check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        //create user
        const user = await User.create(name, email, password);
        //create default user preferences
        await UserPreference.upsert(user.id, {
            dietary_restrictions: [],
            allergies: [],
            preferred_cuisines: [],
            default_servings: 4,
            measurement_unit: 'metric'
        });
        const token = generateToken(user);
        return res.status(201).json({ success: true, message: 'User registered successfully', data:{ user, token } });
}
    catch (error) {
        next(error);
    }
};
/** 
 * Login user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }
        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        //verify password
        const isPasswordValid = await User.verifyPassword(password , user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        //generate token
        const token = generateToken(user);
        return res.status(200).json({ success: true, message: 'User logged in successfully', data:{ user, token } });
    } catch (error) {
        next(error);
    }
    
};
/** 
 * Get current user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};
/**
 * Request password reset (placeholder - would send email in production)
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide email' });
        }
        const user = await User.findByEmail(email);
        // Don't reveal if user exists or not for security reasons
        res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent' });
    } catch (error) {
        next(error);
    }
};