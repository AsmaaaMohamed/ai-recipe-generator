import dotenv from "dotenv";
import {GoogleGenAI} from "@google/genai";
import { fileURLToPath } from "url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set. Gemini AI features will not work.");
}

const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const stripJsonCodeFence = (text = "") => text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const parseGeminiJson = (text, fallbackMessage) => {
    const jsonText = stripJsonCodeFence(text);
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini returned invalid JSON:", jsonText);
        throw createError(fallbackMessage);
    }
};

const numberFrom = (value, fallback = 0) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    const parsed = Number.parseFloat(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRecipe = (recipe, servings) => ({
    name: recipe.name || "Generated Recipe",
    description: recipe.description || "",
    cuisineType: recipe.cuisineType || "any",
    difficulty: recipe.difficulty || "medium",
    prepTime: numberFrom(recipe.prepTime),
    cookTime: numberFrom(recipe.cookTime),
    servings: numberFrom(recipe.servings, servings),
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(ingredient => ({
        name: ingredient.name || "",
        quantity: numberFrom(ingredient.quantity, 1),
        unit: ingredient.unit || ""
    })) : [],
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
    dietaryTags: Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags : [],
    nutrition: {
        calories: numberFrom(recipe.nutrition?.calories),
        protein: numberFrom(recipe.nutrition?.protein),
        carbs: numberFrom(recipe.nutrition?.carbs),
        fats: numberFrom(recipe.nutrition?.fats),
        fiber: numberFrom(recipe.nutrition?.fiber)
    },
    cookingTips: Array.isArray(recipe.cookingTips) ? recipe.cookingTips : []
});

export const generateRecipe = async ({ingredients, dietaryRestrictions=[], cuisineType='any', servings=4, cookingTime='medium'}) => {
    if (!process.env.GEMINI_API_KEY) {
        throw createError("Gemini API key is missing. Add GEMINI_API_KEY to backend/.env and restart the server.");
    }

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
            "nutrition":{
            "calories": number,
            "protein": number,
            "carbs": number,
            "fats": number,
            "fiber": number
            },
            "cookingTips": ["tip 1", "tip 2", "tip 3"]
        }
        The numeric fields must be numbers only, not strings with units.
        Make sure the recipe is creative, delicious, and uses the provided ingredients as much as possible. Avoid using generic filler ingredients that were not listed.`;
    try {
        const response = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents:prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        const generatedText = response.text?.trim();
        if (!generatedText) {
            throw createError("Gemini did not return recipe text. Please try again.");
        }
        return normalizeRecipe(parseGeminiJson(generatedText, "Gemini returned an invalid recipe format. Please try again."), servings);
    }
    catch (error) {
        console.error("Error generating recipe:", error);
        if (error.statusCode) {
            throw error;
        }
        throw createError(error.message || "Failed to generate recipe. Please try again later.");
    }
};
export const generatePanrySuggestions = async (getPantryItems,expiringItems=[]) => {
    if (!process.env.GEMINI_API_KEY) {
        throw createError("Gemini API key is missing. Add GEMINI_API_KEY to backend/.env and restart the server.");
    }

    const ingredientNames = getPantryItems.map(item => item.name);
    const expiringText = expiringItems.length > 0 ? `\nPriority ingredients(expiring soon): ${expiringItems.map(item => item.name).join(', ')}. ` : '';
    const prompt = `Based on these available ingredients: ${ingredientNames.join(', ')}.${expiringText}
    Suggest 3 creative and delicious recipes that can be made using these ingredients. Return ONLY a JSON array of strings (no markdown):["Recipe 1", "Recipe 2", "Recipe 3"]
    Each suggestion should be a brief, appetizing description (1-2 sentences).`;
    try {
        const response = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents:prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        const generatedText = response.text?.trim();
        if (!generatedText) {
            throw createError("Gemini did not return pantry suggestions. Please try again.");
        }
        return parseGeminiJson(generatedText, "Gemini returned invalid pantry suggestions. Please try again.");
    } catch (error) {
        console.error("Error generating pantry suggestions:", error);
        if (error.statusCode) {
            throw error;
        }
        throw createError(error.message || "Failed to generate pantry suggestions. Please try again later.");
    }
};
export const generateCookingTips = async (recipe) => {
    if (!process.env.GEMINI_API_KEY) {
        throw createError("Gemini API key is missing. Add GEMINI_API_KEY to backend/.env and restart the server.");
    }

    const prompt = `For the recipe "${recipe.name}"
    Ingredients: ${recipe.ingredients.map(ing => ing.name).join(', ') || 'N/A'}
    Provide 3-5 helpful cooking tips to ensure the best results. Return ONLY a JSON array of strings (no markdown): ["Tip 1", "Tip 2", "Tip 3"]`;
    try {
        const response = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents:prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        const generatedText = response.text?.trim();
        if (!generatedText) {
            throw createError("Gemini did not return cooking tips. Please try again.");
        }
        return parseGeminiJson(generatedText, "Gemini returned invalid cooking tips. Please try again.");
    } catch (error) {
        console.error("Error generating cooking tips:", error);
        if (error.statusCode) {
            throw error;
        }
        throw createError(error.message || "Failed to generate cooking tips. Please try again later.");
    }
};
export default {
    generateRecipe,
    generatePanrySuggestions,
    generateCookingTips
};
