import ShoppingList from '../models/ShoppingList.js';

/**
 * Generate shopping list based on meal plan
 */
export const generateFromMealPlan = async (req, res,next) => {
    try {
        const {startDate , endDate} = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success:false,
                message:"Please provide start date and end date"
            });
        }
        const shoppingList = await ShoppingList.generateFromMealPlan(req.user.id, startDate, endDate);
        res.status(200).json({
            success:true,
            message:"Shopping list generated successfully",
            data:{shoppingList}
        });
    } catch (error) {
        console.error("Error generating shopping list:", error);
        next(error);
    }
};
/**
 * Get shopping list
* */
export const getShoppingList = async (req, res,next) => {
    try {
        const grouped = req.query.grouped === 'true';
        const items = grouped ? await ShoppingList.getGroupedByCategory(req.user.id) : await ShoppingList.findByUserId(req.user.id);
        res.status(200).json({
            success:true,
            data:{items}
        });
    } catch (error) {
        console.error("Error getting shopping list:", error);
        next(error);
    }
};

/**
 * Add item to shopping list
*/
export const addItem = async (req, res,next) => {
    try {
        const item = await ShoppingList.create(req.user.id, req.body);
        res.status(201).json({
            success:true,
            message:"Item added to shopping list successfully",
            data:{item}
        });
    } catch (error) {
        console.error("Error adding item to shopping list:", error);
        next(error);
    }
};
/**
 * Update shopping list item
* */
export const updateItem = async (req, res,next) => {
    try {
        const { id } = req.params;
        const item = await ShoppingList.update(req.user.id, id, req.body);
        if (!item) {
            return res.status(404).json({
                success:false,
                message:"Item not found"
            });
        }
        res.status(200).json({
            success:true,
            message:"Item updated in shopping list successfully",
            data:{item}
        });
    } catch (error) {
        console.error("Error updating shopping list item:", error);
        next(error);
    }
};
/**
 * Toggle item checked status
*/
export const toggleChecked = async (req, res,next) => {
    try {
        const {id} = req.params;
        const item = await ShoppingList.toggleChecked(req.user.id, id);
        if (!item) {
            return res.status(404).json({
                success:false,
                message:"Item not found"
            });
        }
        res.status(200).json({
            success:true,
            data:{item}
        });
    } catch (error) {
        console.error("Error toggling item checked status:", error);
        next(error);
    }
};
/**
 * Delete item from shopping list
*/
export const deleteItem = async (req, res,next) => {
    try {
        const {id} = req.params;
        const item = await ShoppingList.delete(req.user.id, id);
        if (!item) {
            return res.status(404).json({
                success:false,
                message:"Item not found"
            });
        }
        res.status(200).json({
            success:true,
            message:"Item deleted from shopping list successfully",
            data:{item}
        });
    } catch (error) {
        console.error("Error deleting item from shopping list:", error);
        next(error);
    }
};
/**
 * Clear checked items from shopping list
* */
export const clearChecked = async (req, res,next) => {
    try {
        const items = await ShoppingList.clearChecked(req.user.id);
        res.status(200).json({
            success:true,
            message:"Checked items cleared from shopping list successfully",
            data:{items}
        });
    } catch (error) {
        console.error("Error clearing checked items from shopping list:", error);
        next(error);
    }
};
/**
 * Clear entire shopping list
* */
export const clearAll = async (req, res,next) => {
    try {
        const items = await ShoppingList.clearAll(req.user.id);
        res.status(200).json({
            success:true,
            message:"Shopping list cleared successfully",
            data:{items}
        });
    } catch (error) {
        console.error("Error clearing shopping list:", error);
        next(error);
    }
};
/**
 * Add checked items to pantry
* */
export const addCheckedToPantry = async (req, res,next) => {
    try {
        const items = await ShoppingList.addCheckedToPantry(req.user.id);
        res.status(200).json({
            success:true,
            message:"Checked items added to pantry successfully",
            data:{items}
        });
    } catch (error) {
        console.error("Error adding checked items to pantry:", error);
        next(error);
    }
};
