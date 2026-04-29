import dotenv from "dotenv";
import {GoogleGenAI} from "@google/genai";
import e from "express";

dotenv.config();

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
if (!process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set. Gemini AI features will not work.");
}
export const generateRecipe = async ({ingredients, dietaryRestrictions=[], cuisineType='any', servings=4, cookingTime='medium'}) => {
    const dietaryInfo = dietaryRestrictions.length > 0 ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : 'No dietary restrictions';
    const timeGuide = {
        quick: 'under 30 minutes',
        medium: '30-60 minutes',
        long: 'over 60 minutes'
    };
    const prompt = `Generate a detailed recipe with the following requirements:
        - Ingredients: ${ingredients.join(', ')} 
        ${dietaryInfo}
        - Cuisine type: ${cuisineType}
        - Servings: ${servings}
        - Cooking time: ${timeGuide[cookingTime] || 'any'}
        Please provide a complete recipe in the following JSON format (return ONLY valid JSON, no markdown):
        {
            "name": "Recipe Name",
            "description": "A short description of the recipe",
            "cuisineType":"${cuisineType}",
            "difficulty": "easy/medium/hard",
            "prepTime": "time in minutes",
            "cookTime": "time in minutes",
            "servings": ${servings},
            "ingredients": [
                {
                "name": "Ingredient name",
                "quantity": number,
                "unit": "unit of measurement (e.g., grams, cups)"
            }],
            "instructions": [
                "Step 1 instruction",
                "Step 2 instruction",
                "Step 3 instruction"
            ],
            "dietaryTags": ["vegan", "gluten-free", etc.],
            "nutritiom":{
            "calories": number,
            "protein": "amount in grams",
            "carbs": "amount in grams",
            "fats": "amount in grams",
            "fiber": "amount in grams"
            },
            "cookingTips": ["tip 1", "tip 2", "tip 3"]
        }
        Make sure the recipe is creative, delicious, and uses the provided ingredients as much as possible. Avoid using generic filler ingredients that were not listed.`;
    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents:prompt,
        });
        const generatedText = response.text.trim();
        // Remove markdown code blocks if present
        let jsonText = generatedText;
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        }else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }
        return JSON.parse(jsonText);
    }
    catch (error) {
        console.error("Error generating recipe:", error);
        throw new Error("Failed to generate recipe. Please try again later.");
    }
};
export const generatePanrySuggestions = async (getPantryItems,expiringItems=[]) => {
    const ingredientNames = getPantryItems.map(item => item.name);
    const expiringText = expiringItems.length > 0 ? `\nPriority ingredients(expiring soon): ${expiringItems.map(item => item.name).join(', ')}. ` : '';
    const prompt = ``;
    
}