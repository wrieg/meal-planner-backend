const axios = require('axios');

// TheMealDB API base URL (free tier)
const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// ==================== SEARCH RECIPES BY NAME ====================
const searchRecipesByName = async (query) => {
  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/search.php`, {
      params: { s: query }
    });

    if (!response.data.meals) {
      return [];
    }

    // Transform and clean up the data
    return response.data.meals.map(meal => transformMealData(meal));
  } catch (error) {
    console.error('Error searching recipes by name:', error.message);
    throw new Error('Failed to search recipes from TheMealDB');
  }
};

// ==================== SEARCH RECIPES BY INGREDIENT ====================
const searchRecipesByIngredient = async (ingredient) => {
  try {
    // Note: This endpoint returns limited data, need to fetch full details
    const response = await axios.get(`${MEALDB_BASE_URL}/filter.php`, {
      params: { i: ingredient }
    });

    if (!response.data.meals) {
      return [];
    }

    // Return simplified data (thumbnail and name only)
    return response.data.meals.map(meal => ({
      mealDbId: meal.idMeal,
      name: meal.strMeal,
      thumbnail: meal.strMealThumb
    }));
  } catch (error) {
    console.error('Error searching by ingredient:', error.message);
    throw new Error('Failed to search recipes by ingredient');
  }
};

// ==================== GET RECIPE BY ID ====================
const getRecipeById = async (mealId) => {
  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/lookup.php`, {
      params: { i: mealId }
    });

    if (!response.data.meals || response.data.meals.length === 0) {
      return null;
    }

    return transformMealData(response.data.meals[0]);
  } catch (error) {
    console.error('Error getting recipe by ID:', error.message);
    throw new Error('Failed to fetch recipe details');
  }
};

// ==================== GET RANDOM RECIPE ====================
const getRandomRecipe = async () => {
  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/random.php`);

    if (!response.data.meals || response.data.meals.length === 0) {
      return null;
    }

    return transformMealData(response.data.meals[0]);
  } catch (error) {
    console.error('Error getting random recipe:', error.message);
    throw new Error('Failed to fetch random recipe');
  }
};

// ==================== SEARCH BY CATEGORY ====================
const searchByCategory = async (category) => {
  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/filter.php`, {
      params: { c: category }
    });

    if (!response.data.meals) {
      return [];
    }

    return response.data.meals.map(meal => ({
      mealDbId: meal.idMeal,
      name: meal.strMeal,
      thumbnail: meal.strMealThumb
    }));
  } catch (error) {
    console.error('Error searching by category:', error.message);
    throw new Error('Failed to search recipes by category');
  }
};

// ==================== HELPER: TRANSFORM MEAL DATA ====================
// TheMealDB has weird structure with strIngredient1, strIngredient2, etc.
// This function cleans it up into a nice format
const transformMealData = (meal) => {
  // Extract ingredients and measurements
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : ''
      });
    }
  }

  // Return cleaned up recipe data matching YOUR database schema
  return {
    mealDbId: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory || null,
    area: meal.strArea || null,
    instructions: meal.strInstructions || null,
    thumbnail: meal.strMealThumb || null,
    tags: meal.strTags ? meal.strTags.split(',') : [],
    youtubeUrl: meal.strYoutube || null,
    ingredients: ingredients,
    sourceUrl: meal.strSource || null
  };
};

// ==================== HELPER: PARSE COOKING TIME ====================
// TheMealDB doesn't provide cooking time, so we'll estimate from instructions
const estimateCookingTime = (instructions) => {
  if (!instructions) return null;

  // Look for time mentions in instructions
  const timePatterns = [
    /(\d+)\s*minutes?/i,
    /(\d+)\s*mins?/i,
    /(\d+)\s*hours?/i,
    /(\d+)\s*hrs?/i
  ];

  for (const pattern of timePatterns) {
    const match = instructions.match(pattern);
    if (match) {
      const time = parseInt(match[1]);
      // If hours mentioned, convert to minutes
      if (pattern.toString().includes('hour') || pattern.toString().includes('hr')) {
        return time * 60;
      }
      return time;
    }
  }

  // Default estimate based on instruction length
  const wordCount = instructions.split(' ').length;
  if (wordCount < 100) return 15;
  if (wordCount < 200) return 30;
  if (wordCount < 400) return 45;
  return 60;
};

module.exports = {
  searchRecipesByName,
  searchRecipesByIngredient,
  getRecipeById,
  getRandomRecipe,
  searchByCategory,
  estimateCookingTime
};