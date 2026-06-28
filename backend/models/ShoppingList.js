import db from "../config/db.js";
class ShoppingList {
    /**
     * Generate shopping list for a user based on their meal plan
     * */
    static async generateFromMealPlan(userId, startDate, endDate) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            //clear existing meal plan items
            await client.query(
                'DELETE FROM shopping_list_items WHERE user_id = $1 AND from_meal_plan = true',
                [userId]
            );
            //Get all ingredients from meal plan recipes
            const result = await client.query(
                `SELECT ri.ingredient_name, ri.unit, SUM(ri.quantity) AS total_quantity
                 FROM meal_plans mp
                 JOIN recipe_ingredients ri ON mp.recipe_id = ri.recipe_id
                 WHERE mp.user_id = $1 AND mp.meal_date >= $2 AND mp.meal_date <= $3
                 GROUP BY ri.ingredient_name, ri.unit`,
                [userId, startDate, endDate]
            );
            const ingredients = result.rows;
            //Get pantry items to subtract
            const pantryResult = await client.query(
                'SELECT name, unit, quantity FROM pantry_items WHERE user_id = $1',
                [userId]
            );
            const pantryMap = new Map();
            pantryResult.rows.forEach(item => {
                const key = `${item.name.toLowerCase()}_${item.unit}`;
                pantryMap.set(key, item.quantity);
            });
            //Insert shoppping list items ( subtracting pantry quantities)
            for (const ing of ingredients) {
                const key = `${ing.ingredient_name.toLowerCase()}_${ing.unit}`;
                const pantryQuantity = pantryMap.get(key) || 0;
                const neededQuantity = Math.max(0, parseFloat(ing.total_quantity) - parseFloat(pantryQuantity));
                if (neededQuantity > 0) {
                    await client.query(
                        'INSERT INTO shopping_list_items (user_id, ingredient_name, unit, quantity, from_meal_plan, category) VALUES ($1, $2, $3, $4,true, $5)',
                        [userId, ing.ingredient_name, ing.unit, neededQuantity, 'Uncategorized']
                    );
                }
            }
            await client.query("COMMIT");
            return await this.findByUserId(userId);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
    /**
     * Add manual item to shopping list
     * */
    static async create(userId, itemData) {
        const { ingredient_name, unit, quantity, category='Uncategorized' } = itemData;
        const result = await db.query(
            'INSERT INTO shopping_list_items (user_id, ingredient_name, unit, quantity, from_meal_plan, category) VALUES ($1, $2, $3, $4,false, $5) RETURNING *',
            [userId, ingredient_name, unit, quantity, category]
        );
        return result.rows[0];
    }
    /**
     * Get shopping list items for a user
     * */
    static async findByUserId(userId) {
        const result = await db.query('SELECT * FROM shopping_list_items WHERE user_id = $1 ORDER BY category, ingredient_name', [userId]);
        return result.rows;
    }
    /**
     * Get shopping list items grouped by category for a user
     * */
    static async getGroupedByCategory(userId) {
        const items = await this.findByUserId(userId);
        const grouped = items.reduce((groups, item) => {
            const category = item.category || 'Other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
            return groups;
        }, {});

        return Object.entries(grouped).map(([category, categoryItems]) => ({
            category,
            items: categoryItems,
        }));
    }
    /**
     * Update shopping list item 
     * */
    static async update(userId, itemId,updates) {
        const {ingredient_name, unit, quantity, category, is_checked} = updates;
        const result = await db.query(
            `UPDATE shopping_list_items 
        SET ingredient_name = COALESCE($1, ingredient_name), unit = COALESCE($2, unit), quantity = COALESCE($3, quantity), category = COALESCE($4, category), is_checked = COALESCE($5, is_checked)
            WHERE id = $6 AND user_id = $7 RETURNING *`,
            [ingredient_name, unit, quantity, category, is_checked, itemId, userId]
        );
        return result.rows[0];
    }
    /**
     * Toggle check/uncheck item
     * */
    static async toggleChecked(userId, itemId) {
        const result = await db.query(
            `UPDATE shopping_list_items 
        SET is_checked = NOT is_checked
            WHERE id = $1 AND user_id = $2 RETURNING *`,
            [itemId, userId]
        );
        return result.rows[0];
    }
    /**
     * Delete shopping list item
     * */
    static async delete(userId, itemId) {
        const result = await db.query(
            'DELETE FROM shopping_list_items WHERE id = $1 AND user_id = $2 RETURNING *',
            [itemId, userId]
        );
        return result.rows[0];
    }
    /**
     * Clear checked items from shopping list
     * */
    static async clearChecked(userId) {
        const result = await db.query(
            'DELETE FROM shopping_list_items WHERE user_id = $1 AND is_checked = true RETURNING *',
            [userId]
        );
        return result.rows;
    }
    /**
     * clear entire shopping list
     * */
    static async clearAll(userId) {
        const result = await db.query(
            'DELETE FROM shopping_list_items WHERE user_id = $1 RETURNING *',
            [userId]
        );
        return result.rows;
    }
    /**
     * Add checked items to pantry
     * */
    static async addCheckedToPantry(userId) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            // Get checked items
            const checkedItems = await client.query(
                'SELECT * FROM shopping_list_items WHERE user_id = $1 AND is_checked = true',
                [userId]
            );
            // Add to pantry
            for(const item of checkedItems.rows) {
                await client.query(
                    `INSERT INTO pantry_items (user_id, name, unit, quantity,category) VALUES ($1, $2, $3, $4, $5)`,
                    [userId, item.ingredient_name, item.unit, item.quantity, item.category]
                );
            }
            // Delete checked items from shopping list
            await client.query(
                'DELETE FROM shopping_list_items WHERE user_id = $1 AND is_checked = true',
                [userId]
            );
            await client.query('COMMIT');
            return checkedItems.rows;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
export default ShoppingList;
