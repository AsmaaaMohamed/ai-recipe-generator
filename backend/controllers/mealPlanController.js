import MealPlan from '../models/MealPlan.js';

/**
 * Add recipe to meal plan
 */
export const addToMealPlan = async (req, res,next) => {
    try {
        const mealPlan = await MealPlan.create(req.user.id , req.body);
        res.status(201).json({
            success:true,
            message:"Recipe added to meal plan successfully",
            data:{mealPlan}
        });
    } catch (error) {
        console.error("Error adding to meal plan:", error);
        next(error);
    }
};
/**
 * Get weekly meal plan
 */
export const getWeeklyMealPlan = async (req, res,next) => {
    try {
        const {start_date, weekStartDate} = req.query;
        const startDate = start_date || weekStartDate;
        if (!startDate) {
            return res.status(400).json({
                success:false,
                message:"Please provide start date"
            });
        }
        const mealPlan = await MealPlan.getWeeklyPlan(req.user.id, startDate);
        res.status(200).json({
            success:true,
            data:{mealPlan}
        });
    } catch (error) {
        console.error("Error getting meal plan:", error);
        next(error);
    }
};
/**
 * Get upcoming meals
 */
export const getUpcomingMeals = async (req, res,next) => {
    try {
        const limits = parseInt(req.query.limit) || 5;
        const meals = await MealPlan.getUpcomingMeals(req.user.id, limits);
        res.status(200).json({
            success:true,
            data:{meals}
        });
    } catch (error) {
        console.error("Error getting upcoming meals:", error);
        next(error);
    }
};
/**
 * Delete meal plan entry
 */
export const deleteMealPlan = async (req, res,next) => {
    try {
        const {id} = req.params;
        const mealPlan = await MealPlan.delete(id,req.user.id);
        if (!mealPlan) {
            return res.status(404).json({
                success:false,
                message:"Meal plan not found"
            });
        }
        res.status(200).json({
            success:true,
            message:"Meal plan deleted successfully",
            data:{mealPlan}
        });
    } catch (error) {
        console.error("Error deleting meal plan:", error);
        next(error);
    }
};
/**
 * Get meal plan stats
* */
export const getMealPlanStats = async (req, res,next) => {
    try {
        const stats = await MealPlan.getStats(req.user.id);
        res.status(200).json({
            success:true,
            data:{stats}
        });
    } catch (error) {
        console.error("Error getting meal plan stats:", error);
        next(error);
    }
};