const { pool } = require('../config/database');

// ==================== GET ALL PANTRY ITEMS ====================
const getPantryItems = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        up.pantry_id,
        up.user_id,
        up.ingredient_id,
        i.ingredient_name,
        i.category,
        up.quantity,
        up.unit,
        up.expiration_date,
        up.added_date
       FROM user_pantry up
       JOIN ingredients i ON up.ingredient_id = i.ingredient_id
       WHERE up.user_id = $1
       ORDER BY i.ingredient_name ASC`,
      [userId]
    );

    res.status(200).json({
      count: result.rows.length,
      items: result.rows
    });

  } catch (error) {
    console.error('Get pantry items error:', error);
    res.status(500).json({ 
      error: 'Failed to get pantry items',
      message: error.message 
    });
  }
};

// ==================== ADD PANTRY ITEM ====================
const addPantryItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ingredientName, quantity, unit, expirationDate } = req.body;

    if (!ingredientName) {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }

    // Check if ingredient exists, if not create it
    let ingredientResult = await pool.query(
      'SELECT ingredient_id FROM ingredients WHERE LOWER(ingredient_name) = LOWER($1)',
      [ingredientName]
    );

    let ingredientId;

    if (ingredientResult.rows.length === 0) {
      // Create new ingredient
      ingredientResult = await pool.query(
        'INSERT INTO ingredients (ingredient_name) VALUES ($1) RETURNING ingredient_id',
        [ingredientName]
      );
      ingredientId = ingredientResult.rows[0].ingredient_id;
    } else {
      ingredientId = ingredientResult.rows[0].ingredient_id;
    }

    // Check if user already has this ingredient in pantry
    const existingItem = await pool.query(
      'SELECT * FROM user_pantry WHERE user_id = $1 AND ingredient_id = $2',
      [userId, ingredientId]
    );

    if (existingItem.rows.length > 0) {
      return res.status(409).json({ 
        error: 'This ingredient is already in your pantry',
        pantryId: existingItem.rows[0].pantry_id
      });
    }

    // Add to pantry
    const result = await pool.query(
      `INSERT INTO user_pantry (user_id, ingredient_id, quantity, unit, expiration_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING pantry_id`,
      [userId, ingredientId, quantity || null, unit || null, expirationDate || null]
    );

    // Get the full item details
    const newItem = await pool.query(
      `SELECT 
        up.pantry_id,
        up.user_id,
        up.ingredient_id,
        i.ingredient_name,
        i.category,
        up.quantity,
        up.unit,
        up.expiration_date,
        up.added_date
       FROM user_pantry up
       JOIN ingredients i ON up.ingredient_id = i.ingredient_id
       WHERE up.pantry_id = $1`,
      [result.rows[0].pantry_id]
    );

    res.status(201).json({
      message: 'Item added to pantry',
      item: newItem.rows[0]
    });

  } catch (error) {
    console.error('Add pantry item error:', error);
    res.status(500).json({ 
      error: 'Failed to add pantry item',
      message: error.message 
    });
  }
};

// ==================== UPDATE PANTRY ITEM ====================
const updatePantryItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pantryId } = req.params;
    const { quantity, unit, expirationDate } = req.body;

    // Verify item belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM user_pantry WHERE pantry_id = $1 AND user_id = $2',
      [pantryId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pantry item not found' });
    }

    // Update the item
    await pool.query(
      `UPDATE user_pantry 
       SET quantity = $1, unit = $2, expiration_date = $3, last_updated = CURRENT_TIMESTAMP
       WHERE pantry_id = $4 AND user_id = $5`,
      [quantity, unit, expirationDate, pantryId, userId]
    );

    // Get updated item
    const result = await pool.query(
      `SELECT 
        up.pantry_id,
        up.user_id,
        up.ingredient_id,
        i.ingredient_name,
        i.category,
        up.quantity,
        up.unit,
        up.expiration_date,
        up.added_date
       FROM user_pantry up
       JOIN ingredients i ON up.ingredient_id = i.ingredient_id
       WHERE up.pantry_id = $1`,
      [pantryId]
    );

    res.status(200).json({
      message: 'Pantry item updated',
      item: result.rows[0]
    });

  } catch (error) {
    console.error('Update pantry item error:', error);
    res.status(500).json({ 
      error: 'Failed to update pantry item',
      message: error.message 
    });
  }
};

// ==================== DELETE PANTRY ITEM ====================
const deletePantryItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { pantryId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_pantry WHERE pantry_id = $1 AND user_id = $2 RETURNING *',
      [pantryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pantry item not found' });
    }

    res.status(200).json({
      message: 'Item removed from pantry',
      pantryId: pantryId
    });

  } catch (error) {
    console.error('Delete pantry item error:', error);
    res.status(500).json({ 
      error: 'Failed to delete pantry item',
      message: error.message 
    });
  }
};

// ==================== GET ALL INGREDIENTS (FOR AUTOCOMPLETE) ====================
const getAllIngredients = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT ingredient_id, ingredient_name, category FROM ingredients ORDER BY ingredient_name ASC'
    );

    res.status(200).json({
      count: result.rows.length,
      ingredients: result.rows
    });

  } catch (error) {
    console.error('Get all ingredients error:', error);
    res.status(500).json({ 
      error: 'Failed to get ingredients',
      message: error.message 
    });
  }
};

module.exports = {
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  getAllIngredients
};