import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import pantryRouter from './routes/pantry.js';
import shoppingListRouter from './routes/shoppingList.js';
import mealPlansRouter from './routes/mealPlans.js';
import recipesRouter from './routes/recipes.js';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//test route
app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});
//API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/pantry', pantryRouter);
app.use('/api/shopping-list', shoppingListRouter);
app.use('/api/meal-plans', mealPlansRouter);
app.use('/api/recipes', recipesRouter);

app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
