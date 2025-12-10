const express = require('express');
const router = express.Router();
const {
  searchRecipes,
  getRecipeDetails,
  getRandomRecipe,
  saveRecipe,
  getSavedRecipes,
  deleteSavedRecipe,
  generateGroceryList
} = require('../controllers/recipeController');

const authenticateToken = require('../middleware/authMiddleware');

// Public routes (no auth required)
router.get('/search', searchRecipes);
router.get('/random', getRandomRecipe);
router.get('/:mealId', getRecipeDetails);

// Protected routes (require authentication)
router.post('/save', authenticateToken, saveRecipe);
router.get('/saved/all', authenticateToken, getSavedRecipes);
router.delete('/saved/:recipeId', authenticateToken, deleteSavedRecipe);
router.post('/grocery-list', authenticateToken, generateGroceryList);

module.exports = router;

