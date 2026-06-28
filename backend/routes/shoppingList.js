import express from 'express';
import * as shoppingListController from '../controllers/shoppingListController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
// All routes in this router require authentication
router.use(authMiddleware);

router.get('/', shoppingListController.getShoppingList);
router.post('/generate', shoppingListController.generateFromMealPlan);
router.post('/', shoppingListController.addItem);
router.post('/add-to-pantry', shoppingListController.addCheckedToPantry);
router.put('/:id', shoppingListController.updateItem);
router.put('/:id/toggle', shoppingListController.toggleChecked);
router.delete('/:id', shoppingListController.deleteItem);
router.delete('/clear/checked', shoppingListController.clearChecked);
router.delete('/clear/all', shoppingListController.clearAll);

export default router;
