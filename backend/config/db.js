import dotenv from 'dotenv';
import e from 'express';
import { Pool } from 'pg';

dotenv.config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL === 'production' ? { rejectUnauthorized: false } : false
});
pool.on('connect',() => {
    console.log('Connected to the database');
});
pool.on('error', (err) => {
    console.error('Unexpected database error', err);
    process.exit(-1);
});
export default {
    query: (text, params) => pool.query(text, params),
    pool
};