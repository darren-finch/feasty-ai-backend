import { configDotenv } from "dotenv"
import OpenAI from "openai"
import Food from "./Food"
import MealPlan from "./MealPlan"
import Meal from "./Meal"
import { carbSourcesRef, fatSourcesRef, proteinSourcesRef } from "./foodSourcesRef"

configDotenv()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const NUM_RETRIES = 3
const ALLOWED_CALORIE_VARIANCE_PERCENT: number = 0.03

export const createMealPlan = async (
	mealsPerDay: number,
	desiredCalories: number,
	desiredCarbs: number,
	desiredFats: number,
	desiredProteins: number
) => {
	const openAiApiKey = process.env.OPENAI_API_KEY
	if (openAiApiKey == null) return null

	const proteinNames = proteinSourcesRef.map((food: Food) => `"${food.name}"`)
	const carbNames = carbSourcesRef.map((food: Food) => `"${food.name}"`)
	const fatNames = fatSourcesRef.map((food: Food) => `"${food.name}"`)

	try {
		for (let i = 0; i < NUM_RETRIES; i++) {
			const prompt = `
Create a one day meal plan with ${mealsPerDay} meals using the following exact food names. Be sure to include one protein food, one carb food, and one fat food with each meal:

Proteins: ${proteinNames.join(", ")}
Carbs: ${carbNames.join(", ")}
Fats: ${fatNames.join(", ")}

Give your output in this format:
<Meal Name>
- <Protein food name> | <serving amount>
- <Carb food name> | <serving amount>
- <Fat food name> | <serving amount>

Only give me the names of each meal, the expected serving amounts, and the names of each food going into the meal. Don't give me the summary or any other explanation. Don't list "Meal 1", "Meal 2", etc, in the meal names.
			`
			const completion = await openai.chat.completions.create({
				messages: [{ role: "system", content: prompt }],
				temperature: 0.5,
				model: "gpt-4o",
			})

			const mealPlanString = completion.choices[0].message.content
			if (!mealPlanString) throw new Error("No response from ChatGPT")

			try {
				const mealPlan = parseMealPlan(mealPlanString)
				adjustMacros(mealPlan, desiredCalories, desiredCarbs, desiredFats, desiredProteins)
				return mealPlan
			} catch (error) {
				console.log(error)
				console.log(`Couldn't parse ChatGPT output, retry #${i + 1}...`)
				continue
			}
		}
		throw Error("Failed to generate meal plan")
	} catch (error) {
		console.error("Error generating meal plan:", error)
		return null
	}
}

export function parseMealPlan(mealPlanText: string): MealPlan {
	console.log(`\n\nParsing mealPlanText = \'${mealPlanText}\'`)
	if (mealPlanText == "") {
		return {
			totalActualCalories: 0,
			totalActualCarbs: 0,
			totalActualFats: 0,
			totalActualProtein: 0,
			meals: [],
		}
	}

	const meals: Meal[] = []
	const mealBlocks = mealPlanText.trim().split("\n\n")

	mealBlocks.forEach((block) => {
		console.log(`In for each block for block = \'${block}\'`)
		const lines = block.split("\n")
		const mealName = lines[0].trim()

		const foods: Food[] = lines.slice(1).map((line) => {
			const [foodName, serving] = line.replace("- ", "").split(" | ")
			
			// Splits up the value and unit of the serving
			const match = serving.match(/^(\d+(?:\.\d+)?)(?:\s*([a-zA-Z]+.*)?)?$/);

			if (match) {
				const [_, servingAmount, servingUnit] = match; // Use destructuring to get the captured groups

				// Find the matching food from the reference lists
				const foodRef =
					proteinSourcesRef.find((food) => food.name === foodName.trim()) ||
					carbSourcesRef.find((food) => food.name === foodName.trim()) ||
					fatSourcesRef.find((food) => food.name === foodName.trim())

				if (!foodRef) throw new Error(`Food item ${foodName} not found in references`)

				return {
					...foodRef,
					desiredAmount: Math.trunc(parseFloat(servingAmount)),
					unit: servingUnit ? servingUnit.trim() : "pcs",
				}

			} else {
				throw new Error(`Invalid serving size format`)
			}
		})

		const meal: Meal = {
			name: mealName,
			totalCalories: 0,
			totalCarbs: 0,
			totalFats: 0,
			totalProtein: 0,
			foods,
		}

		updateMealMacros(meal)

		meals.push(meal)
	})

	return {
		totalActualCalories: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalCalories, 0)),
		totalActualCarbs: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalCarbs, 0)),
		totalActualFats: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalFats, 0)),
		totalActualProtein: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalProtein, 0)),
		meals,
	}
}

function adjustMacros(
	mealPlan: MealPlan,
	desiredCalories: number,
	desiredCarbs: number,
	desiredFats: number,
	desiredProteins: number
) {
	const varianceThreshold = ALLOWED_CALORIE_VARIANCE_PERCENT * desiredCalories
	let calorieDiff = desiredCalories - mealPlan.totalActualCalories
	let i = 0
	const maxIterations = 10
	
	while (Math.abs(calorieDiff) > varianceThreshold && i < maxIterations) {
		mealPlan.meals.forEach((meal) => {
			const primaryMacros = { carb: desiredCarbs, fat: desiredFats, protein: desiredProteins }
			Object.keys(primaryMacros).forEach((macro) => {
				meal.foods.forEach((food) => {
					if (food.primaryMacroClass.toLowerCase() === macro && calorieDiff > 0) {
						food.desiredAmount *= 1.10 // Increase by 10%
					} else if (food.primaryMacroClass.toLowerCase() === macro && calorieDiff < 0) {
						food.desiredAmount *= 0.90 // Decrease by 10%
					}
				})
			})

			// Sum total macros for the meal
			updateMealMacros(meal)

			// Sum total macros for entire meal plan
			updateMealPlanMacros(mealPlan)
			calorieDiff = desiredCalories - mealPlan.totalActualCalories

			// Check if the new macros have put the meal plan within the desired calorie range
			if (Math.abs(calorieDiff) <= varianceThreshold) {
				return
			}
		})

		i++
	}
}

// Function to update a meals total macros based on current food amounts
export function updateMealMacros(meal: Meal) {
	meal.totalCalories = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitCalories * (food.desiredAmount / food.unitAmount),
		0
	))
	meal.totalCarbs = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitCarbs * (food.desiredAmount / food.unitAmount),
		0
	))
	meal.totalFats = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitFats * (food.desiredAmount / food.unitAmount),
		0
	))
	meal.totalProtein = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitProtein * (food.desiredAmount / food.unitAmount),
		0
	))
}

// Function to update the total macros of a meal plan based on the current meal macros
export function updateMealPlanMacros(mealPlan: MealPlan) {
	mealPlan.totalActualCalories = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalCalories, 0))
	mealPlan.totalActualCarbs = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalCarbs, 0))
	mealPlan.totalActualFats = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalFats, 0))
	mealPlan.totalActualProtein = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalProtein, 0))
}