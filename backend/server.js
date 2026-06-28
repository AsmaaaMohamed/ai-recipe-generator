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
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://ai-recipe-generator-phi-nine.vercel.app',
];

const allowedOrigins = [
  ...defaultAllowedOrigins,
  process.env.CLIENT_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ''));
const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser and same-origin requests without an Origin header.
    const normalizedOrigin = origin?.replace(/\/$/, '');
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//test route
app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});
//API routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/pantry', pantryRouter);
app.use('/shopping-list', shoppingListRouter);
app.use('/meal-plans', mealPlansRouter);
app.use('/recipes', recipesRouter);

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


