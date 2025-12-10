const express = require('express');
const router = express.Router();
const {
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  getAllIngredients
} = require('../controllers/pantryController');
const authenticateToken = require('../middleware/authMiddleware');

// Get all ingredients for autocomplete
router.get('/ingredients/all', authenticateToken, getAllIngredients);

// All pantry routes require authentication
router.get('/', authenticateToken, getPantryItems);
router.post('/', authenticateToken, addPantryItem);
router.put('/:pantryId', authenticateToken, updatePantryItem);
router.delete('/:pantryId', authenticateToken, deletePantryItem);

module.exports = router;