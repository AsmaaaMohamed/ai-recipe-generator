import User from "../models/User.js";
import UserPreference from "../models/UserPreference.js";
/** * Get user profile
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const preferences = await UserPreference.findByUserId(req.user.id);
        res.status(200).json({ success: true, data: { user, preferences } });
    } catch (error) {
        next(error);
    }
}
/**
 * Update user profile
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const user = await User.update(req.user.id, {name, email});
        res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (error) {
        next(error);
    }
}
/** 
 * Update user preferences
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const updatePreferences = async (req, res, next) => {
    try {
        const preferences = await UserPreference.upsert(req.user.id, req.body);
        res.status(200).json({ success: true, message: 'Preferences updated successfully', data: preferences });
    } catch (error) {
        next(error);
    }
};
/**
 * Change user password
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }
        //verify current password
        const user = await User.findById(req.user.id);
        const isPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid current password' });
        }
        //update password
        await User.updatePassword(req.user.id, newPassword);
        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};
/**
 * Delete user account
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} - The response object
 */
export const deleteAccount = async (req, res, next) => {
    try {
        await User.delete(req.user.id);
        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
};