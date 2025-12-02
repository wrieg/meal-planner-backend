const { pool } = require('../config/database');
const mealDbService = require('../services/mealDbService');

// ==================== SEARCH RECIPES (FROM THEMEALDB) ====================
const searchRecipes = async (req, res) => {
  try {
    const { query, ingredient, category } = req.query;

    let recipes = [];

    if (query) {
      // Search by name
      recipes = await mealDbService.searchRecipesByName(query);
    } else if (ingredient) {
      // Search by ingredient
      recipes = await mealDbService.searchRecipesByIngredient(ingredient);
    } else if (category) {
      // Search by category
      recipes = await mealDbService.searchByCategory(category);
    } else {
      return res.status(400).json({ 
        error: 'Please provide a search query, ingredient, or category' 
      });
    }

    res.status(200).json({
      count: recipes.length,
      recipes: recipes
    });

  } catch (error) {
    console.error('Search recipes error:', error);
    res.status(500).json({ 
      error: 'Failed to search recipes',
      message: error.message 
    });
  }
};

// ==================== GET RECIPE DETAILS BY MEALDB ID ====================
const getRecipeDetails = async (req, res) => {
  try {
    const { mealId } = req.params;

    const recipe = await mealDbService.getRecipeById(mealId);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.status(200).json({ recipe });

  } catch (error) {
    console.error('Get recipe details error:', error);
    res.status(500).json({ 
      error: 'Failed to get recipe details',
      message: error.message 
    });
  }
};

// ==================== GET RANDOM RECIPE ====================
const getRandomRecipe = async (req, res) => {
  try {
    const recipe = await mealDbService.getRandomRecipe();

    if (!recipe) {
      return res.status(404).json({ error: 'No random recipe found' });
    }

    res.status(200).json({ recipe });

  } catch (error) {
    console.error('Get random recipe error:', error);
    res.status(500).json({ 
      error: 'Failed to get random recipe',
      message: error.message 
    });
  }
};

// ==================== SAVE RECIPE TO USER'S ACCOUNT ====================
const saveRecipe = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId; // From JWT middleware
    const { mealDbId, notes } = req.body;

    if (!mealDbId) {
      return res.status(400).json({ error: 'Recipe ID is required' });
    }

    // Fetch full recipe details from TheMealDB
    const recipeData = await mealDbService.getRecipeById(mealDbId);

    if (!recipeData) {
      return res.status(404).json({ error: 'Recipe not found in TheMealDB' });
    }

    await client.query('BEGIN');

    // Check if recipe already exists in our database
    let recipeResult = await client.query(
      'SELECT recipe_id FROM recipes WHERE recipe_id = $1',
      [mealDbId]
    );

    let recipeId;

    if (recipeResult.rows.length === 0) {
      // Recipe doesn't exist, insert it
      const estimatedTime = mealDbService.estimateCookingTime(recipeData.instructions);

      recipeResult = await client.query(
        `INSERT INTO recipes (recipe_id, recipe_name, cuisine_type, meal_category, 
         preparation_time_minutes, cooking_instructions, image_url, video_url, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING recipe_id`,
        [
          recipeData.mealDbId,
          recipeData.name,
          recipeData.area,
          recipeData.category,
          estimatedTime,
          recipeData.instructions,
          recipeData.thumbnail,
          recipeData.youtubeUrl,
          recipeData.sourceUrl || 'TheMealDB'
        ]
      );

      recipeId = recipeResult.rows[0].recipe_id;

      // Insert ingredients
      for (const ing of recipeData.ingredients) {
        // Check if ingredient exists
        let ingredientResult = await client.query(
          'SELECT ingredient_id FROM ingredients WHERE LOWER(ingredient_name) = LOWER($1)',
          [ing.name]
        );

        let ingredientId;

        if (ingredientResult.rows.length === 0) {
          // Insert new ingredient
          ingredientResult = await client.query(
            'INSERT INTO ingredients (ingredient_name) VALUES ($1) RETURNING ingredient_id',
            [ing.name]
          );
          ingredientId = ingredientResult.rows[0].ingredient_id;
        } else {
          ingredientId = ingredientResult.rows[0].ingredient_id;
        }

        // Link recipe and ingredient
        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [recipeId, ingredientId, ing.measure, null]
        );
      }
    } else {
      recipeId = recipeResult.rows[0].recipe_id;
    }

    // Check if user already saved this recipe
    const savedCheck = await client.query(
      'SELECT * FROM user_saved_recipes WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    if (savedCheck.rows.length > 0) {
      await client.query('COMMIT');
      return res.status(200).json({ 
        message: 'Recipe already in your saved recipes',
        recipeId: recipeId
      });
    }

    // Save recipe to user's account
    await client.query(
      'INSERT INTO user_saved_recipes (user_id, recipe_id, notes) VALUES ($1, $2, $3)',
      [userId, recipeId, notes || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Recipe saved successfully',
      recipeId: recipeId,
      recipeName: recipeData.name
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Save recipe error:', error);
    res.status(500).json({ 
      error: 'Failed to save recipe',
      message: error.message 
    });
  } finally {
    client.release();
  }
};

// ==================== GET USER'S SAVED RECIPES ====================
const getSavedRecipes = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        r.recipe_id,
        r.recipe_name,
        r.cuisine_type,
        r.meal_category,
        r.preparation_time_minutes,
        r.image_url,
        usr.saved_date,
        usr.notes
       FROM user_saved_recipes usr
       JOIN recipes r ON usr.recipe_id = r.recipe_id
       WHERE usr.user_id = $1
       ORDER BY usr.saved_date DESC`,
      [userId]
    );

    res.status(200).json({
      count: result.rows.length,
      recipes: result.rows
    });

  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({ 
      error: 'Failed to get saved recipes',
      message: error.message 
    });
  }
};

// ==================== DELETE SAVED RECIPE ====================
const deleteSavedRecipe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recipeId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_saved_recipes WHERE user_id = $1 AND recipe_id = $2 RETURNING *',
      [userId, recipeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved recipe not found' });
    }

    res.status(200).json({ 
      message: 'Recipe removed from saved recipes',
      recipeId: recipeId
    });

  } catch (error) {
    console.error('Delete saved recipe error:', error);
    res.status(500).json({ 
      error: 'Failed to delete saved recipe',
      message: error.message 
    });
  }
};

module.exports = {
  searchRecipes,
  getRecipeDetails,
  getRandomRecipe,
  saveRecipe,
  getSavedRecipes,
  deleteSavedRecipe
};