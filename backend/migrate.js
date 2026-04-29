import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('Running migrations...');
        //read schema.sql file
        const schemaPath = path.join(__dirname,'config' ,'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await client.query(schemaSql);
        console.log('Migrations completed successfully!');
        console.log('tables creareted:');
        console.log('- users');
        console.log('- user_preferences');
        console.log('- pantry_items');
        console.log('- recipes');
        console.log('- recipe_ingredients');
        console.log('- recipe_nutrition');
        console.log('- meal_plans');
        console.log('- shopping_list_items');
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}
runMigrations();